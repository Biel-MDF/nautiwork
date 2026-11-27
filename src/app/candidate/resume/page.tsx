import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { EducationManager, ExperienceManager } from "@/components/account-forms";
import { DeleteProjectButton, ProjectForm } from "@/components/differentials";
import { SkillBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export default async function ResumePage() {
  const user = await requirePageRole("CANDIDATE");
  const p = await db.candidateProfile.findUnique({ where: { userId: user.id }, include: {
    educations: { orderBy: { startYear: "desc" } }, experiences: { orderBy: { startDate: "desc" } }, skills: { include: { skill: true } }, projects: { orderBy: { createdAt: "desc" } } } });
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
      <section aria-labelledby="proj-title" className="mb-8">
        <h2 id="proj-title" className="text-lg font-bold">Projetos do curso</h2>
        <p className="mb-3 mt-1 max-w-[70ch] text-sm text-abyss/70">Sem experiência registrada, seus projetos contam muito. Cadastre o TCC ou um trabalho da escola: o professor confirma por um link e o projeto aparece como confirmado para as empresas.</p>
        {p.projects.length > 0 && <ul className="mb-4 space-y-3">{p.projects.map((pr) => (
          <li key={pr.id} className="card text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0"><p className="font-semibold">{pr.title}</p><p className="text-abyss/70">{pr.school}</p></div>
              {pr.validatedAt ? <span className="rounded-full border border-reef/40 bg-reef/10 px-2 py-0.5 text-xs font-semibold">Confirmado por {pr.teacherName}</span>
                : <span className="chip text-xs">Aguardando o professor</span>}
            </div>
            <p className="mt-2 whitespace-pre-line break-words text-abyss/85">{pr.description}</p>
            {pr.url && <a href={pr.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block break-all font-medium text-tide hover:underline">{pr.url}</a>}
            {pr.validatorNote && <blockquote className="mt-2 border-l-2 border-reef/50 pl-3 italic text-abyss/80">{pr.validatorNote}</blockquote>}
            <div className="mt-3"><DeleteProjectButton id={pr.id} /></div>
          </li>))}</ul>}
        <details className="card" open={p.projects.length === 0}><summary className="cursor-pointer font-semibold">Cadastrar projeto</summary><div className="mt-4"><ProjectForm /></div></details>
      </section>
      <section aria-labelledby="sk-title">
        <h2 id="sk-title" className="mb-3 text-lg font-bold">Habilidades</h2>
        {p.skills.length === 0 ? <p className="text-sm text-abyss/70">Nenhuma habilidade informada. <Link href="/candidate/profile" className="font-semibold text-tide">Adicionar no perfil</Link></p>
          : <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <SkillBadge key={s.skill.id} name={s.skill.name} verified={!!s.verifiedAt} />)}</div>}
        <p className="mt-3 text-sm text-abyss/70"><Link href="/candidate/provas" className="font-semibold text-tide">Faça uma prova de habilidade</Link> para mostrar que sabe.</p>
      </section>
    </Shell>
  );
}
