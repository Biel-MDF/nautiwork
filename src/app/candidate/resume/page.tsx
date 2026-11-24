import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { EducationManager, ExperienceManager } from "@/components/account-forms";

export const dynamic = "force-dynamic";
export default async function ResumePage() {
  const user = await requirePageRole("CANDIDATE");
  const p = await db.candidateProfile.findUnique({ where: { userId: user.id }, include: {
    educations: { orderBy: { startYear: "desc" } }, experiences: { orderBy: { startDate: "desc" } }, skills: { include: { skill: true } } } });
  if (!p) return <Shell role="CANDIDATE" title="Currículo"><Empty title="Perfil não encontrado" hint="Entre em contato com o suporte." /></Shell>;
  return (
    <Shell role="CANDIDATE" title="Currículo">
      <p className="mb-6 text-sm text-abyss/70">
        As empresas veem estas informações quando você se candidata a uma vaga delas. Título, cidade e habilidades ficam em{" "}
        <Link href="/candidate/profile" className="font-semibold text-tide">Perfil</Link>.
      </p>
      <section aria-labelledby="exp-title" className="mb-8">
        <h2 id="exp-title" className="mb-3 text-lg font-bold">Experiência profissional</h2>
        <ExperienceManager items={p.experiences.map((e) => ({ id: e.id, company: e.company, role: e.role, description: e.description,
          startDate: e.startDate.toISOString(), endDate: e.endDate?.toISOString() ?? null }))} />
      </section>
      <section aria-labelledby="edu-title" className="mb-8">
        <h2 id="edu-title" className="mb-3 text-lg font-bold">Formação</h2>
        <EducationManager items={p.educations.map((e) => ({ id: e.id, institution: e.institution, course: e.course, startYear: e.startYear, endYear: e.endYear }))} />
      </section>
      <section aria-labelledby="sk-title">
        <h2 id="sk-title" className="mb-3 text-lg font-bold">Habilidades</h2>
        {p.skills.length === 0 ? <p className="text-sm text-abyss/70">Nenhuma habilidade informada. <Link href="/candidate/profile" className="font-semibold text-tide">Adicionar no perfil</Link></p>
          : <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <span key={s.skill.id} className="rounded-md bg-foam px-2 py-1 text-sm">{s.skill.name}</span>)}</div>}
      </section>
    </Shell>
  );
}
