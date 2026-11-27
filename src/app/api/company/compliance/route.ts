import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { updateCompliance } from "@/modules/company-compliance.service";

/** Dados de cotas (Aprendiz e PcD) e CNPJ da empresa. */
export const PUT = handle(async (req: Request) => {
  const { userId } = await requireRole("COMPANY");
  const { company, notice } = await updateCompliance(userId, await req.json());
  return NextResponse.json({ ok: true, verified: !!company.cnpjVerifiedAt, legalName: company.legalName, notice });
});
