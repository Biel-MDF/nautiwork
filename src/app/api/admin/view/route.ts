import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/errors";
import { realUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { VIEW_COOKIE, viewModeAccount, viewModeHome, viewModes } from "@/lib/view-mode";

const body = z.object({ mode: z.enum([...viewModes, "admin"]) });

/**
 * Liga, troca ou desliga o modo de visualização do admin.
 * O cookie é de sessão (some ao fechar o navegador) e é apagado a cada login e logout.
 */
export const POST = handle(async (req: Request) => {
  const user = await realUser();
  if (!user) throw new HttpError(401, "Faça login para continuar.");
  if (user.role !== "ADMIN") throw new HttpError(403, "Só administradores podem usar o modo de visualização.");
  const { mode } = body.parse(await req.json());

  if (mode === "candidate" || mode === "company") {
    const demo = await db.user.findUnique({ where: { email: viewModeAccount[mode] }, select: { active: true } });
    if (!demo?.active) throw new HttpError(409, "A conta de demonstração dessa visão não está disponível.");
  }

  const res = NextResponse.json({ ok: true, mode, redirect: viewModeHome[mode] });
  if (mode === "admin") res.cookies.delete(VIEW_COOKIE);
  else res.cookies.set(VIEW_COOKIE, mode, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return res;
});
