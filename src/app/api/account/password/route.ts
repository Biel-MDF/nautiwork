import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/rbac";
import { changePassword } from "@/modules/account.service";

export const PUT = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  if (!(await rateLimit(`password:${userId}`, 5, 10 * 60_000))) throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos.");
  return NextResponse.json(await changePassword(userId, await req.json()));
});
