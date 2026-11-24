import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { applyToJob } from "@/modules/applications.service";

export const POST = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE");
  return NextResponse.json(await applyToJob(userId, await req.json()), { status: 201 });
});
