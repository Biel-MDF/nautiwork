import { CompanyName } from "@/components/CompanyName";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty, ScoreRing, StatusBadge } from "@/components/ui";
import { WithdrawButton } from "@/components/forms";
import { appStatusLabel } from "@/lib/labels";

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
            <div className="mt-3"><StatusBadge status={a.status} /></div>
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
            {!["APPROVED", "REJECTED", "WITHDRAWN"].includes(a.status) && <div className="mt-5 border-t border-mist pt-4"><WithdrawButton id={a.id} /></div>}
          </li>))}</ul>}
    </Shell>
  );
}
