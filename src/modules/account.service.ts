import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { accountSchema, companyProfileSchema, notificationsReadSchema, passwordChangeSchema, preferencesSchema } from "@/lib/validators";

export async function updateAccount(userId: string, raw: unknown) {
  const { name } = accountSchema.parse(raw);
  return db.user.update({ where: { id: userId }, data: { name }, select: { id: true, name: true } });
}

export async function changePassword(userId: string, raw: unknown) {
  const { currentPassword, newPassword } = passwordChangeSchema.parse(raw);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "Conta não encontrada.");
  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new HttpError(400, "A senha atual está incorreta.");
  // Subir a versão de sessão desconecta todas as sessões abertas, inclusive a atual.
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 12), sessionVersion: { increment: 1 } } });
  return { ok: true };
}

export async function updateCompanyProfile(userId: string, raw: unknown) {
  const data = companyProfileSchema.parse(raw);
  const company = await db.companyProfile.findUnique({ where: { userId } });
  if (!company) throw new HttpError(400, "Perfil da empresa não encontrado.");
  return db.companyProfile.update({ where: { userId }, data });
}

/** Marca como lidas apenas notificações do próprio usuário; ids de outros são ignorados. */
export async function markNotificationsRead(userId: string, raw: unknown) {
  const input = notificationsReadSchema.parse(raw);
  const where = "all" in input ? { userId, read: false } : { userId, id: { in: input.ids } };
  const { count } = await db.notification.updateMany({ where, data: { read: true } });
  return { updated: count };
}

export async function updatePreferences(userId: string, raw: unknown) {
  const data = preferencesSchema.parse(raw);
  return db.user.update({ where: { id: userId }, data, select: { emailNotifications: true } });
}
