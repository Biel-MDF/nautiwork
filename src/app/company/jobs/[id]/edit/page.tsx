import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { JobForm } from "@/components/forms";

export const dynamic = "force-dynamic";
export default async function EditJob(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await requirePageRole("COMPANY");
  const job = await db.job.findFirst({ where: { id: params.id, company: { userId: user.id } }, include: { skills: { include: { skill: true } } } });
  if (!job || job.status === "CLOSED") notFound();
  return (
    <Shell role="COMPANY" title="Editar vaga">
      <JobForm jobId={job.id} initial={{ title: job.title, description: job.description, responsibilities: job.responsibilities ?? "", requirements: job.requirements ?? "",
        benefits: job.benefits ?? "", area: job.area, location: job.location, workMode: job.workMode, contractType: job.contractType, seniority: job.seniority,
        minYears: job.minYears, salaryMin: job.salaryMin ?? "", salaryMax: job.salaryMax ?? "", skills: job.skills.map((s) => s.skill.name).join(", "),
        forApprentice: job.forApprentice, pcdOnly: job.pcdOnly, postalCode: job.postalCode ?? "" }} />
    </Shell>
  );
}
