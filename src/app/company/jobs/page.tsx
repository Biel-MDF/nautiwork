import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { JobStatusButtons } from "@/components/forms";
import { jobStatusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";
export default async function CompanyJobs() {
  const user = await requirePageRole("COMPANY");
  const jobs = await db.job.findMany({ where: { company: { userId: user.id } }, orderBy: { publishedAt: "desc" }, include: { _count: { select: { applications: true } } } });
  return (
    <Shell role="COMPANY" title="Minhas vagas">
      {jobs.length === 0 ? <Empty title="Você ainda não publicou vagas" hint="Crie a primeira para receber candidaturas." href="/company/jobs/new" cta="Publicar vaga" /> :
        <ul className="space-y-3">{jobs.map((j) => (
          <li key={j.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><Link href={`/jobs/${j.id}`} className="font-semibold hover:text-tide">{j.title}</Link><p className="text-sm text-abyss/70">{jobStatusLabel[j.status]}{j.flagged ? " • retida pela moderação" : ""} • {j._count.applications} candidaturas</p></div>
              {j.status !== "CLOSED" && <Link href={`/company/jobs/${j.id}/edit`} className="btn-ghost">Editar</Link>}
            </div>
            <JobStatusButtons id={j.id} status={j.status} />
          </li>))}</ul>}
    </Shell>
  );
}
