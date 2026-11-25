import { jobCardCompany } from "@/lib/queries";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty, JobCard } from "@/components/ui";
import { SaveButton } from "@/components/forms";

export const dynamic = "force-dynamic";
export default async function SavedJobs() {
  const user = await requirePageRole("CANDIDATE");
  const saved = await db.savedJob.findMany({ where: { candidate: { userId: user.id } }, orderBy: { createdAt: "desc" },
    include: { job: { include: { company: jobCardCompany, skills: { include: { skill: true } } } } } });
  return (
    <Shell role="CANDIDATE" title="Vagas salvas">
      {saved.length === 0 ? <Empty title="Nenhuma vaga salva" hint="Use Salvar vaga na página da vaga para guardar e decidir depois." href="/jobs" cta="Buscar vagas" /> :
        <div className="grid gap-4">{saved.map((s) => <div key={s.jobId} className="space-y-2"><JobCard job={s.job} /><SaveButton jobId={s.jobId} saved /></div>)}</div>}
    </Shell>
  );
}
