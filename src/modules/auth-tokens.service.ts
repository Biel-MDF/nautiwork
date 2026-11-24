import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { AuthTokenType } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { actionMail, sendMail } from "@/lib/mailer";
import { forgotPasswordSchema, resetPasswordSchema, tokenSchema } from "@/lib/validators";

export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora
export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");

/** Gera um token novo e apaga os anteriores ainda não usados do mesmo tipo. Devolve o valor bruto (só vai no e-mail). */
export async function issueToken(userId: string, type: AuthTokenType, ttlMs: number) {
  const raw = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    db.authToken.create({ data: { userId, type, tokenHash: hash(raw), expiresAt: new Date(Date.now() + ttlMs) } }),
  ]);
  return raw;
}

/** Consome o token: só funciona uma vez, dentro do prazo e para o tipo certo. */
async function consumeToken(raw: string, type: AuthTokenType) {
  const token = await db.authToken.findUnique({ where: { tokenHash: hash(raw) } });
  if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date())
    throw new HttpError(400, "Link inválido ou expirado. Peça um novo.");
  // updateMany com usedAt: null evita que duas requisições simultâneas usem o mesmo token.
  const { count } = await db.authToken.updateMany({ where: { id: token.id, usedAt: null }, data: { usedAt: new Date() } });
  if (count === 0) throw new HttpError(400, "Link inválido ou expirado. Peça um novo.");
  return token;
}

export async function sendVerificationEmail(userId: string, baseUrl: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "Conta não encontrada.");
  if (user.emailVerified) return { sent: false, alreadyVerified: true };
  const raw = await issueToken(user.id, "EMAIL_VERIFY", VERIFY_TTL_MS);
  const url = `${baseUrl}/verify-email?token=${raw}`;
  const r = await sendMail(actionMail(user.email, "Confirme seu e-mail no Nautiwork", `Olá, ${user.name}.`,
    "Confirme que este e-mail é seu para manter sua conta segura.", "Confirmar e-mail", url,
    "O link vale por 24 horas. Se você não criou uma conta no Nautiwork, ignore esta mensagem."));
  return { sent: r.sent, alreadyVerified: false };
}

export async function verifyEmail(raw: unknown) {
  const { token } = tokenSchema.parse(raw);
  const t = await consumeToken(token, "EMAIL_VERIFY");
  await db.user.update({ where: { id: t.userId }, data: { emailVerified: new Date() } });
  return { ok: true };
}

/**
 * Sempre responde do mesmo jeito, exista ou não a conta, para não revelar quais e-mails
 * estão cadastrados. Conta desativada não recebe link.
 */
export async function requestPasswordReset(raw: unknown, baseUrl: string) {
  const { email } = forgotPasswordSchema.parse(raw);
  const user = await db.user.findUnique({ where: { email } });
  if (user?.active) {
    const token = await issueToken(user.id, "PASSWORD_RESET", RESET_TTL_MS);
    await sendMail(actionMail(user.email, "Redefinição de senha do Nautiwork", `Olá, ${user.name}.`,
      "Recebemos um pedido para redefinir a senha da sua conta.", "Criar nova senha", `${baseUrl}/reset-password?token=${token}`,
      "O link vale por 1 hora e só pode ser usado uma vez. Se não foi você, ignore esta mensagem: sua senha continua a mesma."));
  }
  return { ok: true };
}

export async function resetPassword(raw: unknown) {
  const { token, newPassword } = resetPasswordSchema.parse(raw);
  const t = await consumeToken(token, "PASSWORD_RESET");
  const user = await db.user.findUnique({ where: { id: t.userId } });
  if (!user?.active) throw new HttpError(400, "Link inválido ou expirado. Peça um novo.");
  await db.$transaction([
    // Quem recebeu o link provou ter acesso ao e-mail, então o e-mail também fica confirmado.
    db.user.update({ where: { id: user.id }, data: {
      passwordHash: await bcrypt.hash(newPassword, 12), sessionVersion: { increment: 1 }, emailVerified: user.emailVerified ?? new Date() } }),
    db.authToken.deleteMany({ where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null } }),
  ]);
  return { ok: true };
}
