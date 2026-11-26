import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole, viewMode } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Avatar, StatusBadge } from "@/components/ui";
import { CompanyName } from "@/components/CompanyName";
import { workModeLabel } from "@/lib/labels";
import { recordResumeView } from "@/modules/resume-views";

export const dynamic = "force-dynamic";
const year = (d: Date | null) => (d ? d.getUTCFullYear() : "atual");

/** Currículo completo de um candidato, aberto pela empresa. Só para quem se candidatou a uma vaga dela. */
export default async function CandidateResume(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const user = await requirePageRole("COMPANY");
  const company = await db.companyProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!company) notFound();
  const c = await db.candidateProfile.findFirst({
    where: { id, user: { active: true }, applications: { some: { job: { companyId: company.id } } } },
    include: {
      user: { select: { id: true, name: true, email: true, image: { select: { updatedAt: true } } } },
      skills: { include: { skill: true } },
      educations: { orderBy: { startYear: "desc" } },
      experiences: { orderBy: { startDate: "desc" } },
      applications: { where: { job: { companyId: company.id } }, include: { job: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) notFound();
  // o administrador vendo como empresa não conta como visualização
  if (!(await viewMode())) await recordResumeView(company.id, c.id);

  return (
    <Shell role="COMPANY" title="Currículo">
      <Link href="/company/candidates" className="mb-4 inline-block text-sm text-tide hover:underline">Todos os candidatos</Link>
      <article className="card space-y-6">
        <header className="flex items-start gap-4">
          <Avatar userId={c.user.id} name={c.user.name} version={c.user.image?.updatedAt} size={64} />
          <div className="min-w-0 break-words">
            <h2 className="font-display text-2xl font-semibold"><CompanyName name={c.user.name} person /></h2>
            <p className="text-abyss/75">{c.headline ?? "Sem título profissional"}</p>
            <p className="mt-1 text-sm text-abyss/70">{[c.location ?? "Cidade não informada", c.workMode ? workModeLabel[c.workMode] : null, `${c.yearsExperience} ${c.yearsExperience === 1 ? "ano" : "anos"} de experiência`].filter(Boolean).join(", ")}</p>
            <p className="mt-1 text-sm"><a className="text-tide hover:underline" href={`mailto:${c.user.email}`}>{c.user.email}</a>
              {c.linkedinUrl && <> · <a className="text-tide hover:underline" href={c.linkedinUrl} rel="noopener noreferrer nofollow" target="_blank">LinkedIn</a></>}</p>
          </div>
        </header>
        {c.about && <section><h3 className="font-semibold">Sobre</h3><p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed">{c.about}</p></section>}
        {c.objective && <section><h3 className="font-semibold">Objetivo</h3><p className="mt-1 whitespace-pre-line break-words text-sm">{c.objective}</p></section>}
        <section><h3 className="font-semibold">Habilidades</h3>
          {c.skills.length > 0 ? <div className="mt-2 flex flex-wrap gap-1.5">{c.skills.map((s) => <span key={s.skill.id} className="chip">{s.skill.name}</span>)}</div>
            : <p className="mt-1 text-sm text-abyss/60">Não informadas.</p>}</section>
        <section><h3 className="font-semibold">Experiência</h3>
          {c.experiences.length === 0 ? <p className="mt-1 text-sm text-abyss/60">Não informada.</p> :
            <ul className="mt-2 space-y-3 text-sm">{c.experiences.map((e) => <li key={e.id}><p className="font-medium">{e.role}, {e.company}</p>
              <p className="text-abyss/60">{year(e.startDate)} – {year(e.endDate)}</p>{e.description && <p className="mt-1 whitespace-pre-line">{e.description}</p>}</li>)}</ul>}</section>
        <section><h3 className="font-semibold">Formação</h3>
          {c.educations.length === 0 ? <p className="mt-1 text-sm text-abyss/60">Não informada.</p> :
            <ul className="mt-2 space-y-1 text-sm">{c.educations.map((e) => <li key={e.id}>{e.course}, {e.institution} ({e.startYear} – {e.endYear ?? "em andamento"})</li>)}</ul>}</section>
        <section className="border-t border-mist pt-4"><h3 className="font-semibold">Candidaturas nas suas vagas</h3>
          <ul className="mt-2 space-y-1.5 text-sm">{c.applications.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2">
              <Link href={`/company/applications?job=${a.job.id}`} className="hover:text-tide">{a.job.title}</Link>
              {a.compatibility !== null && <span className="tabular text-abyss/70">{a.compatibility}% de compatibilidade</span>}
              <StatusBadge status={a.status} />
            </li>))}</ul></section>
        <p className="text-xs text-abyss/60">O candidato é avisado de que sua empresa abriu o currículo dele.</p>
      </article>
    </Shell>
  );
}
