import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";
import { HttpError } from "./errors";

type Role = "CANDIDATE" | "COMPANY" | "ADMIN";

/**
 * Confere no banco se a sessão ainda vale: conta ativa e mesma versão de sessão.
 * A versão sobe quando a senha é trocada ou redefinida, o que derruba sessões antigas.
 */
export async function currentUser() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, role: true, active: true, sessionVersion: true, emailVerified: true } });
  if (!user?.active || user.sessionVersion !== (session.user.sv ?? 0)) return null;
  return user;
}

/** Para Route Handlers: lança 401/403. */
export async function requireRole(...roles: Role[]) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Faça login para continuar.");
  if (!roles.includes(user.role)) throw new HttpError(403, "Você não tem permissão para esta ação.");
  return { userId: user.id, role: user.role };
}

/** Para páginas (server components): redireciona em vez de lançar. */
export async function requirePageRole(role: Role) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect("/");
  return user;
}
