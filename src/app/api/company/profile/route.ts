import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { updateCompanyProfile } from "@/modules/account.service";

export const PUT = handle(async (req: Request) => {
  const { userId } = await requireRole("COMPANY");
  return NextResponse.json(await updateCompanyProfile(userId, await req.json()));
});
