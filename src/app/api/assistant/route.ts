import { createHash } from "node:crypto";
import { createAgentUIStreamResponse, type LanguageModel } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { HttpError, handle } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { splitDemo } from "@/lib/display";
import { currentUser } from "@/lib/rbac";
import { createAssistantAgent } from "@/modules/assistant/agent";
import { ASSISTANT_LIMITS, assistantAvailable, assistantEnabled, assistantMockEnabled } from "@/modules/assistant/config";
import { assistantErrorText, classifyAssistantError } from "@/modules/assistant/errors";
import { ASSISTANT_MODES, modeAllowed } from "@/modules/assistant/prompt";

export const dynamic = "force-dynamic";
// uma resposta com 2 ou 3 consultas leva poucos segundos; o teto evita conta presa
export const maxDuration = 60;

const textPart = z.object({ type: z.literal("text"), text: z.string() }).loose();
const message = z.object({
  id: z.string().max(100),
  role: z.enum(["user", "assistant"]),
  parts: z.array(z.object({ type: z.string().max(60) }).loose()).max(30),
}).loose();
const bodySchema = z.object({
  messages: z.array(message).min(1).max(ASSISTANT_LIMITS.messages),
  mode: z.enum(ASSISTANT_MODES).optional(),
  jobId: z.string().trim().regex(/^[a-z0-9_]{1,40}$/i).optional(),
}).loose();

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** Quem está conversando, para a tela ajustar sugestões. Não revela nada além do perfil. */
const OFF = "O assistente está desligado no momento.";

export const GET = handle(async () => {
  if (!assistantEnabled()) throw new HttpError(404, OFF);
  const user = await currentUser();
  return NextResponse.json({
    available: assistantAvailable(),
    role: user?.role ?? "VISITOR",
    // empresa é chamada pelo nome inteiro; pessoa, pelo primeiro nome
    firstName: user ? (user.role === "COMPANY" ? splitDemo(user.name).name : splitDemo(user.name).name.split(/\s+/)[0]) : null,
  }, { headers: { "Cache-Control": "private, no-store" } });
});

export const POST = handle(async (req: Request) => {
  if (!assistantEnabled()) throw new HttpError(404, OFF);
  if (!assistantAvailable()) throw new HttpError(503, assistantErrorText.auth);

  const raw = await req.text();
  if (raw.length > ASSISTANT_LIMITS.bodyBytes) throw new HttpError(413, "A conversa ficou longa demais. Comece uma nova.");
  let json: unknown;
  try { json = JSON.parse(raw); } catch { throw new HttpError(400, "Mensagem inválida."); }
  const body = bodySchema.parse(json);

  const last = body.messages.at(-1)!;
  const question = last.parts.filter((p) => p.type === "text").map((p) => textPart.safeParse(p).data?.text ?? "").join("").trim();
  if (last.role !== "user" || !question) throw new HttpError(400, "Escreva uma pergunta.");
  if (question.length > ASSISTANT_LIMITS.userText) throw new HttpError(400, `A pergunta pode ter até ${ASSISTANT_LIMITS.userText} caracteres.`);

  const user = await currentUser();
  // visitante tem limite menor; pessoa logada é contada pela conta, não pelo IP
  const ok = user
    ? await rateLimit(`assistant:u:${user.id}`, 20, 5 * 60_000) && await rateLimit(`assistant:ud:${user.id}`, 150, 86_400_000)
    : await rateLimit(`assistant:ip:${clientIp(req)}`, 8, 5 * 60_000) && await rateLimit(`assistant:ipd:${clientIp(req)}`, 40, 86_400_000);
  if (!ok) throw new HttpError(429, "Você fez muitas perguntas em pouco tempo. Espere alguns minutos e tente de novo.");

  const mode = body.mode ?? "carreira";
  if (!modeAllowed(mode, user?.role ?? "VISITOR")) {
    throw new HttpError(user ? 403 : 401, mode === "empresa" ? "Este modo é para empresas logadas." : "Entre como candidato para usar este modo.");
  }
  const viewer = user ? { id: user.id, role: user.role } : null;
  let model: LanguageModel | undefined;
  if (assistantMockEnabled()) model = (await import("@/modules/assistant/mock-model")).createMockAssistantModel();
  const agent = createAssistantAgent({
    viewer, name: user?.name, model, mode, jobId: body.jobId,
    // identificador opaco: a Gateway agrupa o gasto por pessoa sem receber o id real
    userTag: user ? createHash("sha256").update(`nw-assistant:${user.id}`).digest("hex").slice(0, 16) : undefined,
  });

  try {
    return await createAgentUIStreamResponse({
      agent,
      uiMessages: body.messages.slice(-ASSISTANT_LIMITS.history),
      abortSignal: req.signal,
      timeout: { totalMs: 55_000 },
      sendReasoning: false,
      onError: (error) => {
        const kind = classifyAssistantError(error);
        // a mensagem da Gateway diz a causa exata (cartão, créditos, modelo) e não traz dados pessoais
        const detail = error instanceof Error ? error.message : String(error);
        console.error(`[assistente] ${kind}: ${detail.slice(0, 500)}`);
        if (kind !== "rate") Sentry.captureException(error, { tags: { area: "assistente", falha: kind } });
        return assistantErrorText[kind];
      },
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    // mensagens que não batem com as ferramentas (histórico adulterado ou antigo)
    if (e instanceof Error && /validat|invalid/i.test(`${e.name} ${e.message}`)) throw new HttpError(400, "Não entendi o histórico da conversa. Comece uma nova.");
    throw e;
  }
});
