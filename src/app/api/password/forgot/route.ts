import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { handle, HttpError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/modules/auth-tokens.service";

// Resposta igual exista ou não a conta (não revela e-mails cadastrados).
export const POST = handle(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const body = await req.json();
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!(await rateLimit(`forgot:ip:${ip}`, 10, 15 * 60_000)) || !(await rateLimit(`forgot:email:${email}`, 3, 15 * 60_000)))
    throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos.");
  await requestPasswordReset(body, appUrl(req));
  return NextResponse.json({ ok: true, message: "Se houver uma conta com este e-mail, enviamos um link para redefinir a senha." });
});
