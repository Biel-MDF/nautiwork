import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/errors";
import { realUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { VIEW_COOKIE, viewModeHome, viewModes } from "@/lib/view-mode";
import { splitDemo } from "@/lib/display";

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

  // a visão usa a conta do próprio admin: na primeira vez, cria o perfil de candidato ou de empresa dele
  if (mode === "candidate") await db.candidateProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  if (mode === "company") await db.companyProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, name: splitDemo(user.name).name }, update: {} });

  const res = NextResponse.json({ ok: true, mode, redirect: viewModeHome[mode] });
  if (mode === "admin") res.cookies.delete(VIEW_COOKIE);
  else res.cookies.set(VIEW_COOKIE, mode, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return res;
});
