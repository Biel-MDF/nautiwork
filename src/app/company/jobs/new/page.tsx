import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { JobForm } from "@/components/forms";

// /company/jobs/new?tipo=aprendiz ou ?tipo=pcd: vem da página de cotas, já com o tipo marcado
export default async function NewJob(props: { searchParams: Promise<{ tipo?: string }> }) {
  await requirePageRole("COMPANY");
  const { tipo } = await props.searchParams;
  const initial = tipo === "aprendiz" ? { forApprentice: true, contractType: "CLT", seniority: "INTERN", minYears: 0 }
    : tipo === "pcd" ? { pcdOnly: true } : {};
  return <Shell role="COMPANY" title="Nova vaga"><JobForm initial={initial} /></Shell>;
}
