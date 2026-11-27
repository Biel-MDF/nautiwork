import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { checkinSchema } from "@/lib/validators";
import { answerCheckin } from "@/modules/hiring";

type Ctx = { params: Promise<{ id: string }> };

/** Resposta ao acompanhamento de 30, 60 ou 90 dias. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY");
  return NextResponse.json(await answerCheckin(userId, (await params).id, checkinSchema.parse(await req.json())));
});
