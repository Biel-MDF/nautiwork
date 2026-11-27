import { CompanyName } from "@/components/CompanyName";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty, ScoreRing, StatusBadge } from "@/components/ui";
import { WithdrawButton } from "@/components/forms";
import { appStatusLabel } from "@/lib/labels";
import { noReplyDays } from "@/modules/hiring";
import { REJECT_REASONS, coursesFor } from "@/modules/courses";

export const dynamic = "force-dynamic";
export default async function Applications() {
  const user = await requirePageRole("CANDIDATE");
  const apps = await db.jobApplication.findMany({ where: { candidate: { userId: user.id } }, orderBy: { createdAt: "desc" },
    include: { job: { include: { company: true } }, history: { orderBy: { createdAt: "asc" } } } });
  return (
    <Shell role="CANDIDATE" title="Minhas candidaturas">
      {apps.length === 0 ? <Empty title="Nenhuma candidatura" hint="Quando você se candidatar, o andamento aparece aqui." href="/jobs" cta="Buscar vagas" /> :
        <ul className="space-y-3">{apps.map((a) => (
          <li key={a.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link href={`/jobs/${a.jobId}`} className="font-display text-[17px] font-semibold hover:text-deep">{a.job.title}</Link>
                <p className="mt-0.5 text-sm text-abyss/70"><CompanyName name={a.job.company.name} /></p>
              </div>
              {a.compatibility !== null && <ScoreRing score={a.compatibility} />}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={a.status} />
              {noReplyDays(a.createdAt, a.status) > 0 && <span className="chip border-coral/40 text-coral" title="A empresa ainda não mexeu nesta candidatura">Sem retorno há {noReplyDays(a.createdAt, a.status)} dias</span>}</div>
            {/* linha do tempo: cada mudança de etapa, da mais antiga para a mais recente */}
            <ol className="mt-5 space-y-0 text-sm" aria-label="Histórico da candidatura">{a.history.map((h, i) => {
              const last = i === a.history.length - 1;
              return (
                <li key={h.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {!last && <span className="absolute left-[5px] top-3.5 h-full w-px bg-mist" aria-hidden="true" />}
                  <span className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${last ? "border-tide bg-tide shadow-[0_0_0_4px_rgb(var(--c-tide)/0.15)]" : "border-mist bg-fossa"}`} aria-hidden="true" />
                  <span className={last ? "font-medium text-abyss" : "text-abyss/75"}>{appStatusLabel[h.status]}</span>
                  <time className="tabular ml-auto text-abyss/60" dateTime={h.createdAt.toISOString()}>{h.createdAt.toLocaleDateString("pt-BR")}</time>
                </li>);
            })}</ol>
            {a.status === "REJECTED" && a.rejectReason && (
              <section className="mt-5 rounded-control border border-mist bg-foam/40 p-4 text-sm" aria-label="Retorno da empresa">
                <p><span className="font-semibold">Retorno da empresa:</span> {REJECT_REASONS[a.rejectReason as keyof typeof REJECT_REASONS] ?? "Outro motivo"}.</p>
                {a.rejectSkills.length > 0 && <>
                  <p className="mt-3 font-medium">Para a próxima, vale desenvolver:</p>
                  <ul className="mt-2 space-y-2">{a.rejectSkills.map((sk) => (
                    <li key={sk}><span className="chip">{sk}</span>
                      <span className="mt-1 block text-abyss/75">Cursos gratuitos: {coursesFor(sk).map((c, i) => <span key={c.url}>{i > 0 && ", "}<a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium text-tide hover:underline" title={c.hint}>{c.provider}</a></span>)}</span></li>))}</ul>
                </>}
                <p className="mt-3 text-abyss/70">Depois de estudar, faça a <Link href="/candidate/provas" className="font-medium text-tide hover:underline">prova de habilidade</Link> para mostrar que aprendeu.</p>
              </section>)}
            {!["APPROVED", "REJECTED", "WITHDRAWN"].includes(a.status) && <div className="mt-5 border-t border-mist pt-4"><WithdrawButton id={a.id} /></div>}
          </li>))}</ul>}
    </Shell>
  );
}
