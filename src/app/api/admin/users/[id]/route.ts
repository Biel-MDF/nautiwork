import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { invalidatePublic } from "@/lib/cache";

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { userId } = await requireRole("ADMIN");
  const { active } = z.object({ active: z.boolean() }).parse(await req.json());
  if ((await params).id === userId) throw new HttpError(400, "Você não pode desativar a própria conta.");
  const user = await db.user.update({ where: { id: (await params).id }, data: { active }, select: { id: true, active: true } });
  invalidatePublic();
  return NextResponse.json(user);
});
