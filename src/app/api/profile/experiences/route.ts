import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { addExperience } from "@/modules/resume.service";

export const POST = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE");
  return NextResponse.json(await addExperience(userId, await req.json()), { status: 201 });
});
