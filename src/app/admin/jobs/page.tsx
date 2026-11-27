import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { AdminToggle } from "@/components/forms";
import { REPORT_REASONS } from "@/modules/reports.service";

export const dynamic = "force-dynamic";
export default async function AdminJobs() {
  await requirePageRole("ADMIN");
  const jobs = await db.job.findMany({ orderBy: [{ flagged: "desc" }, { publishedAt: "desc" }], take: 100, include: { company: true, reports: { orderBy: { createdAt: "desc" }, select: { id: true, reason: true, createdAt: true } } } });
  const label = (r: string) => { const [k, ...rest] = r.split(": "); return `${REPORT_REASONS[k as keyof typeof REPORT_REASONS] ?? k}${rest.length ? `: ${rest.join(": ")}` : ""}`; };
  return (
    <Shell role="ADMIN" title="Moderação de vagas">
      <ul className="space-y-2">{jobs.map((j) => (
        <li key={j.id} className="card flex flex-wrap items-center justify-between gap-3">
          <div><Link href={`/jobs/${j.id}`} className="font-semibold hover:text-tide">{j.title}</Link><p className="text-sm text-abyss/70">{j.company.name} • {j.flagged ? "retida (oculta do público)" : "visível"}{j.company.cnpjVerifiedAt ? " • CNPJ verificado" : ""}</p>
            {j.reports.length > 0 && <details className="mt-1 text-sm"><summary className="cursor-pointer font-medium text-coral">{j.reports.length} {j.reports.length === 1 ? "denúncia" : "denúncias"}</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-abyss/80">{j.reports.map((r) => <li key={r.id} className="break-words">{label(r.reason)} <span className="text-abyss/60">({r.createdAt.toLocaleDateString("pt-BR")})</span></li>)}</ul></details>}</div>
          <AdminToggle url={`/api/admin/jobs/${j.id}`} field="flagged" value={j.flagged} onLabel="Liberar vaga" offLabel="Reter vaga" />
        </li>))}</ul>
    </Shell>
  );
}
