import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { ConfirmJobButton, JobStatusButtons } from "@/components/forms";
import { DEMO_EMAIL_DOMAIN, JOB_VALID_DAYS, jobValidity } from "@/modules/hiring";
import { salaryRange } from "@/lib/labels";
import { jobStatusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";
export default async function CompanyJobs() {
  const user = await requirePageRole("COMPANY");
  const jobs = await db.job.findMany({ where: { company: { userId: user.id } }, orderBy: { publishedAt: "desc" }, include: { _count: { select: { applications: true } } } });
  const now = new Date();
  return (
    <Shell role="COMPANY" title="Minhas vagas">
      <p className="mb-4 text-sm text-abyss/70">Cada vaga fica no ar por {JOB_VALID_DAYS} dias a partir da última confirmação. Antes de vencer, confirme que ainda está contratando; assim o site não mostra vagas que já foram preenchidas.</p>
      {jobs.length === 0 ? <Empty title="Você ainda não publicou vagas" hint="Crie a primeira para receber candidaturas." href="/company/jobs/new" cta="Publicar vaga" /> :
        <ul className="space-y-3">{jobs.map((j) => (
          <li key={j.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><Link href={`/jobs/${j.id}`} className="font-semibold hover:text-tide">{j.title}</Link><p className="text-sm text-abyss/70">{jobStatusLabel[j.status]}{j.flagged ? " • retida pela moderação" : ""} • {j._count.applications} candidaturas</p></div>
              {j.status !== "CLOSED" && <Link href={`/company/jobs/${j.id}/edit`} className="btn-ghost">Editar</Link>}
            </div>
            <Validity job={j} now={now} demo={user.email.endsWith(DEMO_EMAIL_DOMAIN)} />
            {!j.salaryMin && j.status !== "CLOSED" && <p className="rounded-control border border-coral/40 bg-coral/10 px-3 py-2 text-sm">Esta vaga não tem faixa salarial. Edite e informe o salário: agora ele é obrigatório e aparece para o candidato.</p>}
            <JobStatusButtons id={j.id} status={j.status} />
          </li>))}</ul>}
    </Shell>
  );
}

function Validity({ job, now, demo }: { demo: boolean; job: { id: string; status: string; confirmedAt: Date; expiredAt: Date | null; salaryMin: number | null; salaryMax: number | null }; now: Date }) {
  if (job.status === "CLOSED") return null;
  if (job.expiredAt) return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-coral/40 bg-coral/10 px-3 py-2">
      <p className="text-sm">Saiu do ar em {job.expiredAt.toLocaleDateString("pt-BR")} por falta de confirmação.</p>
      <ConfirmJobButton id={job.id} label="Ainda estou contratando, publicar de novo" />
    </div>);
  const v = jobValidity(job.confirmedAt, now);
  if (job.status !== "ACTIVE") return null;
  if (demo) return <p className="rounded-control border border-mist px-3 py-2 text-sm text-abyss/70">Empresa de demonstração: as vagas dela não vencem.</p>;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-control border px-3 py-2 ${v.warn ? "border-coral/40 bg-coral/10" : "border-mist"}`}>
      <p className="text-sm">{v.warn ? <strong>Vence em {v.daysLeft} {v.daysLeft === 1 ? "dia" : "dias"}.</strong> : <>No ar até {v.expiresAt.toLocaleDateString("pt-BR")}.</>}
        {salaryRange(job.salaryMin, job.salaryMax) && <span className="text-abyss/70"> Faixa: {salaryRange(job.salaryMin, job.salaryMax)}</span>}</p>
      {v.warn && <ConfirmJobButton id={job.id} />}
    </div>);
}
