import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { ComplianceForm } from "@/components/differentials";
import { COMPANY_SIZES, estimateQuotas, type CompanySize } from "@/modules/quotas";
import { formatCnpj } from "@/modules/cnpj";

export const dynamic = "force-dynamic";
export default async function CotasPage() {
  const user = await requirePageRole("COMPANY");
  const c = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!c) return <Shell role="COMPANY" title="Cotas e CNPJ"><Empty title="Perfil da empresa não encontrado" hint="Complete o perfil da empresa primeiro." href="/company/profile" cta="Ir ao perfil" /></Shell>;
  const [apprenticeJobs, pcdJobs] = await Promise.all([
    db.job.count({ where: { companyId: c.id, status: "ACTIVE", forApprentice: true } }),
    db.job.count({ where: { companyId: c.id, status: "ACTIVE", pcdOnly: true } }),
  ]);
  const est = c.employees != null && c.companySize ? estimateQuotas({ employees: c.employees, size: c.companySize as CompanySize, apprentices: c.apprentices, pcdEmployees: c.pcdEmployees }) : null;
  const pct = (r: number) => `${Math.round(r * 100)}%`;
  return (
    <Shell role="COMPANY" title="Cotas e CNPJ">
      <div className="space-y-6">
        <section className="card text-sm" aria-labelledby="cnpj-status">
          <h2 id="cnpj-status" className="font-display text-lg font-semibold">Verificação da empresa</h2>
          {c.cnpjVerifiedAt ? <p className="mt-2"><span className="inline-flex rounded-full border border-reef/40 bg-reef/10 px-2 py-0.5 text-xs font-semibold">Empresa verificada</span>
            <span className="ml-2 text-abyss/80">{c.legalName} · CNPJ {formatCnpj(c.cnpj!)} · conferido em {c.cnpjVerifiedAt.toLocaleDateString("pt-BR")}</span></p>
            : <p className="mt-2 text-abyss/80">{c.cnpj ? `CNPJ ${formatCnpj(c.cnpj)} salvo, mas sem situação ativa confirmada.` : "Informe o CNPJ para ganhar o selo \"Empresa verificada\" nas suas vagas. Candidatos confiam mais em vagas de empresa conferida."}</p>}
        </section>

        <ComplianceForm sizes={COMPANY_SIZES} initial={{ cnpj: c.cnpj ?? "", companySize: c.companySize ?? "", employees: c.employees ?? "", apprentices: c.apprentices ?? 0, pcdEmployees: c.pcdEmployees ?? 0 }} />

        {est && (
          <section aria-labelledby="quota-title" className="space-y-4">
            <h2 id="quota-title" className="font-display text-lg font-semibold">Estimativa das cotas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <article className="card text-sm">
                <h3 className="font-semibold">Jovem Aprendiz</h3>
                {est.apprentice.required ? <>
                  <p className="tabular mt-2 text-3xl font-semibold">{est.apprentice.min} a {est.apprentice.max}</p>
                  <p className="text-abyss/70">aprendizes (5% a 15% de {c.employees} funcionários)</p>
                  <p className={`mt-3 ${est.apprentice.missing ? "text-coral" : "text-abyss/80"}`}>{est.apprentice.missing ? `Faltam ${est.apprentice.missing} para o mínimo. Você tem ${est.apprentice.current}.` : est.apprentice.current > est.apprentice.max ? `Você informou ${est.apprentice.current}, acima do limite de 15%. Confira o número.` : `Mínimo atendido: ${est.apprentice.current} contratados.`}</p>
                </> : <p className="mt-2 text-abyss/80">{est.apprentice.exemptReason}</p>}
                <p className="mt-3 text-abyss/70">Vagas de aprendiz abertas agora: <span className="tabular font-semibold text-abyss">{apprenticeJobs}</span></p>
                <Link href="/company/jobs/new?tipo=aprendiz" className="btn-primary mt-4">Abrir vaga de Jovem Aprendiz</Link>
              </article>
              <article className="card text-sm">
                <h3 className="font-semibold">Pessoas com deficiência (PcD)</h3>
                {est.pcd.required ? <>
                  <p className="tabular mt-2 text-3xl font-semibold">{est.pcd.min}</p>
                  <p className="text-abyss/70">vagas no mínimo ({pct(est.pcd.rate)} de {c.employees} funcionários)</p>
                  <p className={`mt-3 ${est.pcd.missing ? "text-coral" : "text-abyss/80"}`}>{est.pcd.missing ? `Faltam ${est.pcd.missing} para o mínimo. Você tem ${est.pcd.current}.` : `Mínimo atendido: ${est.pcd.current} contratados.`}</p>
                </> : <p className="mt-2 text-abyss/80">A cota começa em empresas com 100 ou mais funcionários. Contratar pessoas com deficiência continua sendo bem-vindo.</p>}
                <p className="mt-3 text-abyss/70">Vagas PcD abertas agora: <span className="tabular font-semibold text-abyss">{pcdJobs}</span></p>
                <Link href="/company/jobs/new?tipo=pcd" className="btn-primary mt-4">Abrir vaga para PcD</Link>
              </article>
            </div>
            <p className="max-w-[80ch] text-xs leading-relaxed text-abyss/60">Estimativa a partir dos números informados, não é parecer jurídico. A cota de aprendiz (CLT, art. 429) é calculada sobre as funções que exigem formação profissional; aqui usamos o total de funcionários como aproximação. A cota PcD segue a Lei 8.213/1991, art. 93. Confirme com a contabilidade ou o jurídico da empresa.</p>
          </section>
        )}
      </div>
    </Shell>
  );
}
