import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Stat } from "@/components/ui";
import { appStatusLabel } from "@/lib/labels";
import { ViewAsButtons } from "@/components/ViewMode";

export const dynamic = "force-dynamic";

const order = ["SUBMITTED", "IN_REVIEW", "IN_PROCESS", "INTERVIEW", "APPROVED", "REJECTED", "WITHDRAWN"] as const;
const tone: Record<(typeof order)[number], string> = {
  SUBMITTED: "bg-[#A9BCD8]", IN_REVIEW: "bg-tide/60", IN_PROCESS: "bg-tide", INTERVIEW: "bg-reef/70",
  APPROVED: "bg-reef", REJECTED: "bg-coral", WITHDRAWN: "bg-[#5B6F92]",
};
const roleLabel = { CANDIDATE: "Candidato", COMPANY: "Empresa", ADMIN: "Admin" } as const;

export default async function AdminDashboard() {
  await requirePageRole("ADMIN");
  const [candidates, companies, jobs, flagged, apps, inactive, byStatus, recent] = await Promise.all([
    db.user.count({ where: { role: "CANDIDATE" } }), db.user.count({ where: { role: "COMPANY" } }), db.job.count(),
    db.job.count({ where: { flagged: true } }), db.jobApplication.count(), db.user.count({ where: { active: false } }),
    db.jobApplication.groupBy({ by: ["status"], _count: { _all: true } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } }),
  ]);
  const count = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Record<string, number>;
  return (
    <Shell role="ADMIN" title="Painel administrativo">
      <section className="mb-6" aria-labelledby="ver-como">
        <h2 id="ver-como" className="font-semibold">Ver o site como um usuário</h2>
        <p className="mb-3 mt-1 text-sm text-abyss/65">Só leitura e sem salvar nada. Usa contas da demonstração e volta ao modo admin a cada login ou ao fechar o navegador.</p>
        <ViewAsButtons />
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Candidatos" value={candidates} /><Stat label="Empresas" value={companies} /><Stat label="Vagas" value={jobs} />
        <Stat label="Candidaturas" value={apps} /><Stat label="Vagas retidas" value={flagged} /><Stat label="Contas desativadas" value={inactive} />
      </div>

      <section className="card mt-6" aria-labelledby="etapas">
        <h2 id="etapas" className="font-semibold">Candidaturas por etapa</h2>
        {apps === 0 ? <p className="mt-2 text-sm text-abyss/70">Nenhuma candidatura ainda.</p> : <>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-foam" aria-hidden="true">
            {order.filter((k) => count[k]).map((k) => <span key={k} className={`${tone[k]} h-full border-r-2 border-casco last:border-r-0`} style={{ width: `${(count[k] / apps) * 100}%` }} />)}
          </div>
          <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {order.map((k) => <li key={k} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${tone[k]}`} aria-hidden="true" />{appStatusLabel[k]}<span className="tabular ml-auto font-semibold">{count[k] ?? 0}</span></li>)}
          </ul></>}
      </section>

      <section className="mt-6" aria-labelledby="cadastros">
        <div className="mb-3 flex items-end justify-between gap-3"><h2 id="cadastros" className="font-semibold">Últimos cadastros</h2><Link href="/admin/users" className="text-sm font-semibold text-tide hover:underline">Ver todas as contas</Link></div>
        <ul className="divide-y divide-mist overflow-hidden rounded-panel border border-mist bg-casco">
          {recent.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3.5 text-sm">
              <span className="min-w-0"><span className="block truncate font-medium">{u.name}</span><span className="block truncate text-abyss/60">{u.email}</span></span>
              <span className="flex items-center gap-3 text-abyss/70">
                <span className="chip">{roleLabel[u.role]}</span>
                {!u.active && <span className="chip border-coral/40 text-coral">Desativada</span>}
                <time className="tabular" dateTime={u.createdAt.toISOString()}>{u.createdAt.toLocaleDateString("pt-BR")}</time>
              </span>
            </li>))}
        </ul>
      </section>
    </Shell>
  );
}
