import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/rbac";
import { addMessage } from "@/modules/support.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { userId, role } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  if (!(await rateLimit(`support-msg:${userId}`, 30, 60 * 60_000))) throw new HttpError(429, "Muitas mensagens em pouco tempo. Aguarde um pouco.");
  return NextResponse.json(await addMessage(userId, role, (await params).id, await req.json()), { status: 201 });
});
