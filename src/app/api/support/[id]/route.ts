import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { setTicketStatus } from "@/modules/support.service";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { userId, role } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  return NextResponse.json(await setTicketStatus(userId, role, (await params).id, await req.json()));
});
