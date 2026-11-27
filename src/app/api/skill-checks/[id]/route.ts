import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { submitCheck } from "@/modules/skill-checks.service";

type Ctx = { params: Promise<{ id: string }> };

/** Envia as respostas; a correção é feita aqui no servidor. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { userId } = await requireRole("CANDIDATE");
  return NextResponse.json(await submitCheck(userId, (await params).id, await req.json()));
});
