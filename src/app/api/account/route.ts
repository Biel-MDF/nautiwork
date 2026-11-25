import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { updateAccount } from "@/modules/account.service";
import { deleteAccount } from "@/modules/privacy.service";

export const PATCH = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  return NextResponse.json(await updateAccount(userId, await req.json()));
});

// Exclusão definitiva da conta, com senha e a palavra EXCLUIR como confirmação.
export const DELETE = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  if (!(await rateLimit(`delete-account:${userId}`, 5, 15 * 60_000))) throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos.");
  return NextResponse.json(await deleteAccount(userId, await req.json()));
});
