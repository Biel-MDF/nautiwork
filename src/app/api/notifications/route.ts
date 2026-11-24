import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { markNotificationsRead } from "@/modules/account.service";

// Corpo: { "ids": ["..."] } para marcar algumas, ou { "all": true } para todas.
export const PATCH = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  return NextResponse.json(await markNotificationsRead(userId, await req.json()));
});
