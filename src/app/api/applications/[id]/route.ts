import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { updateApplicationStatus, withdrawApplication } from "@/modules/applications.service";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { userId } = await requireRole("COMPANY");
  return NextResponse.json(await updateApplicationStatus(userId, (await params).id, await req.json()));
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const { userId } = await requireRole("CANDIDATE");
  return NextResponse.json(await withdrawApplication(userId, (await params).id));
});
