import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/errors";
import { realUser, requireRole } from "@/lib/rbac";
import { setUserActive } from "@/modules/admin-users.service";

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole("ADMIN");
  // a hierarquia vale para quem está de fato logado, não para a conta do modo de visualização
  const me = await realUser();
  const { active } = z.object({ active: z.boolean() }).parse(await req.json());
  return NextResponse.json(await setUserActive(me!.id, (await params).id, active));
});
