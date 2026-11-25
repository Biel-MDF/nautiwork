import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators";
import { appUrl } from "@/lib/app-url";
import { sendVerificationEmail } from "@/modules/auth-tokens.service";
import { TERMS_VERSION } from "@/lib/legal";
import { invalidatePublic } from "@/lib/cache";

export const POST = handle(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!(await rateLimit(`register:${ip}`, 5, 10 * 60_000))) throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos.");
  const { name, email, password, role, companyName } = registerSchema.parse(await req.json());
  if (await db.user.findUnique({ where: { email } })) throw new HttpError(409, "Este e-mail já está cadastrado.");
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      name, email, passwordHash, role, termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION,
      ...(role === "CANDIDATE" ? { candidate: { create: {} } } : { company: { create: { name: companyName! } } }),
    },
  });
  // O cadastro não depende do e-mail: se o envio falhar, a pessoa pede outro link no painel.
  try { await sendVerificationEmail(user.id, appUrl(req)); }
  catch (e) { console.error("[register] e-mail de confirmação não enviado:", (e as Error).message); }
  invalidatePublic();
  return NextResponse.json({ ok: true }, { status: 201 });
});
