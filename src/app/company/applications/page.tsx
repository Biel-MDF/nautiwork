import { CompanyName } from "@/components/CompanyName";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Avatar, Empty, ScoreRing, StatusBadge } from "@/components/ui";
import { StatusSelect } from "@/components/forms";
import { noReplyDays } from "@/modules/hiring";

export const dynamic = "force-dynamic";
export default async function CompanyApplications(props: { searchParams: Promise<{ job?: string }> }) {
  const searchParams = await props.searchParams;
  const user = await requirePageRole("COMPANY");
  const jobs = await db.job.findMany({ where: { company: { userId: user.id } }, select: { id: true, title: true }, orderBy: { publishedAt: "desc" } });
  const apps = await db.jobApplication.findMany({
    where: { job: { company: { userId: user.id }, ...(searchParams.job ? { id: searchParams.job } : {}) } },
    orderBy: [{ compatibility: "desc" }, { createdAt: "desc" }],
    include: { job: true, candidate: { include: { user: { include: { image: { select: { updatedAt: true } } } }, skills: { include: { skill: true } } } } },
  });
  return (
    <Shell role="COMPANY" title="Candidaturas">
      <form className="mb-5 flex flex-wrap gap-2"><label className="sr-only" htmlFor="job">Filtrar por vaga</label>
        <select id="job" name="job" defaultValue={searchParams.job ?? ""} className="input max-w-xs"><option value="">Todas as vagas</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
        <button className="btn-ghost">Filtrar</button></form>
      {apps.length === 0 ? <Empty title="Nenhuma candidatura" hint="Elas aparecem aqui assim que alguém se candidatar às suas vagas." /> :
        <ul className="space-y-3">{apps.map((a) => (
          <li key={a.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar userId={a.candidate.user.id} name={a.candidate.user.name} version={a.candidate.user.image?.updatedAt} size={44} />
                <div className="min-w-0 break-words">
                  <p className="font-display font-semibold"><CompanyName name={a.candidate.user.name} person /></p>
                  <p className="text-sm text-abyss/70">{a.candidate.headline ?? "Sem título profissional"}, {a.candidate.location ?? "cidade não informada"}</p>
                  <p className="mt-1 text-sm">Para <Link href={`/jobs/${a.job.id}`} className="font-medium text-tide hover:underline">{a.job.title}</Link></p>
                </div>
              </div>
              {a.compatibility !== null && <ScoreRing score={a.compatibility} />}
            </div>
            {a.candidate.skills.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{a.candidate.skills.map((s) => <span key={s.skill.id} className="chip">{s.skill.name}</span>)}</div>}
            <Link href={`/company/candidates/${a.candidate.id}`} className="btn-ghost mt-4">Ver currículo completo</Link>
            {a.coverNote && <blockquote className="mt-4 border-l-2 border-tide/50 pl-3 text-sm italic text-abyss/85 whitespace-pre-line break-words">{a.coverNote}</blockquote>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-mist pt-4">
              <p className="flex flex-wrap items-center gap-2 text-sm text-abyss/70">Etapa atual <StatusBadge status={a.status} />
                {noReplyDays(a.createdAt, a.status) > 0 && <span className="chip border-coral/40 text-coral">Sem resposta há {noReplyDays(a.createdAt, a.status)} dias</span>}</p>
              <StatusSelect id={a.id} current={a.status} />
            </div>
          </li>))}</ul>}
    </Shell>
  );
}
