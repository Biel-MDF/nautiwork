import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { confirmJob } from "@/modules/hiring";

type Ctx = { params: Promise<{ id: string }> };

/** A empresa confirma que a vaga ainda está aberta (renova a validade de 30 dias). */
export const POST = handle(async (_req: Request, { params }: Ctx) => {
  const { userId } = await requireRole("COMPANY");
  return NextResponse.json(await confirmJob(userId, (await params).id));
});
