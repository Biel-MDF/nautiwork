import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { updateAccount } from "@/modules/account.service";

export const PATCH = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  return NextResponse.json(await updateAccount(userId, await req.json()));
});
