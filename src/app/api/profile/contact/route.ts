import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { updateContact } from "@/modules/contact.service";

/** WhatsApp (com autorização) e CEP (estimativa de deslocamento) do candidato. */
export const PUT = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE");
  return NextResponse.json(await updateContact(userId, await req.json()));
});
