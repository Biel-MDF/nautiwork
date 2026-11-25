// Modelo de mentira para testes e desenvolvimento sem IA: responde por roteiro, sem rede.
// Só é usado quando ASSISTANT_MOCK=1 e nunca em produção (ver route.ts).
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4CallOptions, LanguageModelV4StreamPart } from "@ai-sdk/provider";

const usage = { inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 10, text: 10, reasoning: undefined } };

function lastUserText(prompt: LanguageModelV4CallOptions["prompt"]) {
  for (let i = prompt.length - 1; i >= 0; i--) {
    const m = prompt[i];
    if (m.role === "user") return m.content.map((p) => (p.type === "text" ? p.text : "")).join(" ");
  }
  return "";
}

function text(t: string): LanguageModelV4StreamPart[] {
  const words = t.split(/(?<= )/);
  return [{ type: "text-start", id: "t" }, ...words.map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
    { type: "text-end", id: "t" }, { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage }];
}

export function createMockAssistantModel() {
  return new MockLanguageModelV4({
    provider: "nautiwork-mock", modelId: "roteiro",
    doStream: async ({ prompt }) => {
      const last = prompt[prompt.length - 1];
      const ask = lastUserText(prompt).toLowerCase();
      let chunks: LanguageModelV4StreamPart[];
      if (last?.role === "tool") {
        chunks = text("Encontrei estas vagas para você. Veja os detalhes em [todas as vagas](/jobs).");
      } else if (ask.includes("vaga")) {
        const termo = ask.match(/vagas? de ([\p{L}\s-]+)/u)?.[1]?.trim();
        chunks = [{ type: "tool-call", toolCallId: "c1", toolName: "buscar_vagas", input: JSON.stringify(termo ? { termo } : {}) },
          { type: "finish", finishReason: { unified: "tool-calls", raw: undefined }, usage }];
      } else {
        chunks = text("Olá! Sou o assistente do Nautiwork. Posso buscar vagas, explicar a compatibilidade e o uso do site.");
      }
      return { stream: simulateReadableStream({ chunks, chunkDelayInMs: 5 }) };
    },
  });
}
