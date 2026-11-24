import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { AdminToggle } from "@/components/forms";

export const dynamic = "force-dynamic";
export default async function AdminJobs() {
  await requirePageRole("ADMIN");
  const jobs = await db.job.findMany({ orderBy: { publishedAt: "desc" }, take: 100, include: { company: true } });
  return (
    <Shell role="ADMIN" title="Moderação de vagas">
      <ul className="space-y-2">{jobs.map((j) => (
        <li key={j.id} className="card flex flex-wrap items-center justify-between gap-3">
          <div><Link href={`/jobs/${j.id}`} className="font-semibold hover:text-tide">{j.title}</Link><p className="text-sm text-abyss/70">{j.company.name} • {j.flagged ? "retida (oculta do público)" : "visível"}</p></div>
          <AdminToggle url={`/api/admin/jobs/${j.id}`} field="flagged" value={j.flagged} onLabel="Liberar vaga" offLabel="Reter vaga" />
        </li>))}</ul>
    </Shell>
  );
}
