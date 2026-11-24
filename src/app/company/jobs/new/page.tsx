import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { JobForm } from "@/components/forms";
export default async function NewJob() {
  await requirePageRole("COMPANY");
  return <Shell role="COMPANY" title="Nova vaga"><JobForm /></Shell>;
}
