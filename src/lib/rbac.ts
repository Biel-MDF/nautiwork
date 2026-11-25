import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VIEW_COOKIE, parseViewMode, viewModeAccount } from "./view-mode";
import { auth } from "./auth";
import { db } from "./db";
import { HttpError } from "./errors";

type Role = "CANDIDATE" | "COMPANY" | "ADMIN";

/**
 * Confere no banco se a sessão ainda vale: conta ativa e mesma versão de sessão.
 * A versão sobe quando a senha é trocada ou redefinida, o que derruba sessões antigas.
 */
const userSelect = { id: true, name: true, email: true, role: true, active: true, sessionVersion: true, emailVerified: true,
  emailNotifications: true, image: { select: { updatedAt: true } } } as const;

/** Quem está de fato logado, sem considerar o modo de visualização. Uma consulta por requisição. */
export const realUser = cache(async () => {
  const session = await auth();
  if (!session?.user) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: userSelect });
  if (!user?.active || user.sessionVersion !== (session.user.sv ?? 0)) return null;
  return user;
});

/**
 * Modo de visualização ativo. Só vale para admin: o cookie de qualquer outra pessoa é ignorado,
 * então ninguém ganha acesso por ele (o admin só pode "descer" para uma visão com menos poder).
 */
export const viewMode = cache(async () => {
  // sem o cookie (o caso de quase todo mundo), nenhuma consulta ao banco
  const mode = parseViewMode((await cookies()).get(VIEW_COOKIE)?.value);
  if (!mode) return null;
  const real = await realUser();
  return real?.role === "ADMIN" ? mode : null;
});

/**
 * Usuário que as telas devem considerar. Em modo de visualização, o admin aparece como
 * visitante (null) ou como uma conta da demonstração; as ações ficam bloqueadas no middleware.
 */
export const currentUser = cache(async () => {
  const real = await realUser();
  const mode = await viewMode();
  if (!mode) return real;
  if (mode === "visitor") return null;
  const demo = await db.user.findUnique({ where: { email: viewModeAccount[mode] }, select: userSelect });
  return demo?.active ? demo : real;
});

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

/** Para páginas abertas a qualquer pessoa logada (ex.: suporte). */
export async function requirePageUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
