import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { deleteProject } from "@/modules/projects.service";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const { userId } = await requireRole("CANDIDATE");
  await deleteProject(userId, (await params).id);
  return NextResponse.json({ ok: true });
});
