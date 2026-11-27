// Cotas (Aprendiz e PcD) e verificação de CNPJ da empresa.
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { invalidatePublic } from "@/lib/cache";
import { complianceSchema } from "@/lib/validators";
import { isValidCnpj, lookupCnpj } from "./cnpj";

export async function updateCompliance(userId: string, raw: unknown, fetcher: typeof fetch = fetch) {
  const data = complianceSchema.parse(raw);
  const company = await db.companyProfile.findUnique({ where: { userId } });
  if (!company) throw new HttpError(400, "Complete o perfil da empresa primeiro.");
  let cnpjFields: { cnpj?: string | null; legalName?: string | null; cnpjVerifiedAt?: Date | null } = {};
  let notice: string | null = null;
  if (data.cnpj !== (company.cnpj ?? null)) {
    if (data.cnpj === null) cnpjFields = { cnpj: null, legalName: null, cnpjVerifiedAt: null };
    else {
      if (!isValidCnpj(data.cnpj)) throw new HttpError(400, "CNPJ inválido: confira os números.", { cnpj: ["CNPJ inválido: confira os números."] });
      const taken = await db.companyProfile.findFirst({ where: { cnpj: data.cnpj, NOT: { id: company.id } }, select: { id: true } });
      if (taken) throw new HttpError(409, "Este CNPJ já está ligado a outra conta. Fale com o suporte.", { cnpj: ["Este CNPJ já está ligado a outra conta."] });
      const r = await lookupCnpj(data.cnpj, fetcher);
      if (r.ok && r.active) cnpjFields = { cnpj: data.cnpj, legalName: r.legalName, cnpjVerifiedAt: new Date() };
      else if (r.ok) { cnpjFields = { cnpj: data.cnpj, legalName: r.legalName, cnpjVerifiedAt: null }; notice = `A Receita informa a situação "${r.status.toLowerCase()}". Só CNPJ ativo recebe o selo de empresa verificada.`; }
      else if (r.reason === "not_found") throw new HttpError(400, "Não encontramos este CNPJ na base da Receita.", { cnpj: ["Não encontramos este CNPJ na base da Receita."] });
      else { cnpjFields = { cnpj: data.cnpj, cnpjVerifiedAt: null }; notice = "Não conseguimos consultar a Receita agora. O CNPJ foi salvo; tente verificar de novo mais tarde."; }
    }
  }
  const updated = await db.companyProfile.update({ where: { id: company.id }, data: {
    companySize: data.companySize, employees: data.employees, apprentices: data.apprentices, pcdEmployees: data.pcdEmployees, ...cnpjFields } });
  invalidatePublic();
  return { company: updated, notice };
}
