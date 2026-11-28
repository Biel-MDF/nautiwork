import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { invalidatePublic } from "@/lib/cache";

/**
 * Ativar ou desativar uma conta pelo painel do admin. Hierarquia:
 * - o Imperador (administrador maior) não pode ser desativado por ninguém;
 * - só o Imperador desativa ou reativa outros administradores;
 * - ninguém desativa a própria conta por aqui.
 */
export async function setUserActive(actorId: string, targetId: string, active: boolean) {
  if (actorId === targetId) throw new HttpError(400, "Você não pode desativar a própria conta.");
  const [actor, target] = await Promise.all([
    db.user.findUnique({ where: { id: actorId }, select: { role: true, emperor: true } }),
    db.user.findUnique({ where: { id: targetId }, select: { role: true, emperor: true } }),
  ]);
  if (!target) throw new HttpError(404, "Conta não encontrada.");
  if (target.emperor) throw new HttpError(403, "O Imperador não pode ser desativado.");
  if (target.role === "ADMIN" && !actor?.emperor) throw new HttpError(403, "Só o Imperador pode desativar ou reativar administradores.");
  const user = await db.user.update({ where: { id: targetId }, data: { active }, select: { id: true, active: true } });
  invalidatePublic();
  return user;
}
