import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/rbac";
import { createTicket } from "@/modules/support.service";

export const POST = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  if (!(await rateLimit(`support:${userId}`, 5, 60 * 60_000))) throw new HttpError(429, "Muitos pedidos em pouco tempo. Tente de novo mais tarde.");
  return NextResponse.json(await createTicket(userId, await req.json()), { status: 201 });
});
