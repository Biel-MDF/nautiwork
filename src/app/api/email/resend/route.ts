import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { handle, HttpError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/rbac";
import { sendVerificationEmail } from "@/modules/auth-tokens.service";

export const POST = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  if (!(await rateLimit(`verify-resend:${userId}`, 3, 15 * 60_000))) throw new HttpError(429, "Aguarde alguns minutos antes de pedir outro e-mail.");
  const r = await sendVerificationEmail(userId, appUrl(req));
  if (r.alreadyVerified) return NextResponse.json({ ok: true, message: "Seu e-mail já está confirmado." });
  if (!r.sent) throw new HttpError(503, "O envio de e-mail não está disponível agora. Tente mais tarde.");
  return NextResponse.json({ ok: true, message: "Enviamos um novo link de confirmação." });
});
