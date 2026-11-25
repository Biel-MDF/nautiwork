import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ApplyButton, SaveButton } from "@/components/forms";
import { ScoreRing } from "@/components/ui";
import { contractLabel, salaryRange, seniorityLabel, workModeLabel } from "@/lib/labels";
import { computeCompatibility } from "@/modules/compatibility";
import { CompanyName } from "@/components/CompanyName";

export const dynamic = "force-dynamic";

export default async function JobPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const job = await db.job.findUnique({ where: { id: params.id }, include: { company: true, skills: { include: { skill: true } } } });
  const session = await auth();
  const isOwner = job && session?.user.id === job.company.userId;
  if (!job || (!isOwner && session?.user.role !== "ADMIN" && (job.flagged || job.status === "CLOSED"))) notFound();

  let compat = null, applied = false, saved = false;
  if (session?.user.role === "CANDIDATE") {
    const p = await db.candidateProfile.findUnique({ where: { userId: session.user.id }, include: { skills: { include: { skill: true } } } });
    if (p) {
      compat = computeCompatibility(
        { skills: p.skills.map((s) => s.skill.name), interestArea: p.interestArea, workMode: p.workMode, location: p.location, yearsExperience: p.yearsExperience },
        { skills: job.skills.map((s) => s.skill.name), area: job.area, workMode: job.workMode, location: job.location, minYears: job.minYears });
      applied = !!(await db.jobApplication.findUnique({ where: { jobId_candidateId: { jobId: job.id, candidateId: p.id } } }));
      saved = !!(await db.savedJob.findUnique({ where: { candidateId_jobId: { candidateId: p.id, jobId: job.id } } }));
    }
  }
  const salary = salaryRange(job.salaryMin, job.salaryMax);
  const block = (t: string, c?: string | null) => c ? <section className="mt-8"><h2 className="text-lg font-semibold">{t}</h2><p className="mt-2 max-w-[68ch] whitespace-pre-line leading-relaxed text-abyss/85">{c}</p></section> : null;
  const facts: [string, string][] = [
    ["Modalidade", workModeLabel[job.workMode]], ["Contratação", contractLabel[job.contractType]],
    ["Nível", seniorityLabel[job.seniority]], ["Salário", salary ?? "A combinar"],
  ];
  return (
    <>
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 pb-32 pt-10 lg:grid-cols-[1fr_340px] lg:pb-10">
        <article className="min-w-0">
          {job.status !== "ACTIVE" && <p role="status" className="mb-5 rounded-control border border-coral/40 bg-coral/10 p-3 text-sm text-coral">Esta vaga está {job.status === "PAUSED" ? "pausada" : "encerrada"} e não recebe candidaturas.</p>}
          <Link href={`/companies/${job.company.id}`} className="text-sm font-medium text-tide hover:text-deep hover:underline"><CompanyName name={job.company.name} /></Link>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-[40px]">{job.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-abyss/75">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-tide/80"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.8"/></svg>
            {job.location}
          </p>
          <dl className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-panel border border-mist bg-mist sm:grid-cols-4">
            {facts.map(([k, v]) => <div key={k} className={`bg-casco px-4 py-3.5 ${k === "Salário" ? "col-span-3 sm:col-span-1" : ""}`}><dt className="text-xs text-abyss/60">{k}</dt><dd className="tabular mt-1 text-sm font-semibold">{v}</dd></div>)}
          </dl>
          {block("Sobre a vaga", job.description)}{block("Responsabilidades", job.responsibilities)}{block("Requisitos", job.requirements)}{block("Benefícios", job.benefits)}
          {job.skills.length > 0 && <section className="mt-8"><h2 className="text-lg font-semibold">Habilidades pedidas</h2>
            <div className="mt-3 flex flex-wrap gap-2">{job.skills.map((s) => <span key={s.skillId} className="chip px-2.5 py-1 text-sm">{s.skill.name}</span>)}</div></section>}
        </article>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-3 [&_.btn-ghost]:w-full [&_.btn-primary]:w-full max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20 max-lg:flex max-lg:items-start max-lg:gap-2 max-lg:space-y-0 max-lg:rounded-none max-lg:border-x-0 max-lg:border-b-0 max-lg:bg-fossa/95 max-lg:px-4 max-lg:py-3 max-lg:backdrop-blur-md max-lg:[&>*]:flex-1">
            {session?.user.role === "COMPANY" || session?.user.role === "ADMIN" ? <p className="text-sm text-abyss/80">Só contas de candidato podem se candidatar.</p> : (
              <>
                {job.status === "ACTIVE" && <ApplyButton jobId={job.id} applied={applied} loggedIn={!!session} />}
                {session?.user.role === "CANDIDATE" && <SaveButton jobId={job.id} saved={saved} />}
              </>
            )}
          </div>
          {compat && (
            <section className="card" aria-labelledby="compat-title">
              <div className="flex items-center gap-4">
                <ScoreRing score={compat.score} size={72} />
                <div><h2 id="compat-title" className="font-semibold">Compatibilidade</h2>
                  <p className="mt-0.5 text-xs leading-snug text-abyss/60">Estimativa por regras. Não mede sua capacidade profissional.</p></div>
              </div>
              <ul className="mt-5 space-y-3.5 text-sm">{compat.criteria.map((c) => (
                <li key={c.key}>
                  <div className="flex items-baseline justify-between gap-3"><span className="font-medium">{c.label}</span><span className="tabular text-xs text-abyss/55">peso {c.weight}</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foam" aria-hidden="true"><div className={`h-full rounded-full ${c.ratio >= 1 ? "bg-reef" : c.ratio > 0 ? "bg-tide" : "bg-transparent"}`} style={{ width: `${Math.round(c.ratio * 100)}%` }} /></div>
                  <p className="mt-1 text-abyss/70">{c.detail}</p>
                </li>))}</ul>
              {compat.missingSkills.length > 0 && <div className="mt-5 border-t border-mist pt-4 text-sm"><p className="font-medium">Habilidades que faltam no seu perfil</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{compat.missingSkills.map((m) => <span key={m} className="chip border-coral/30 text-coral">{m}</span>)}</div></div>}
            </section>
          )}
          {session?.user.role === "CANDIDATE" && !compat && <p className="card text-sm">Complete seu perfil para ver a compatibilidade. <Link className="font-semibold text-tide hover:underline" href="/candidate/profile">Ir para o perfil</Link></p>}
        </aside>
      </main>
      <Footer />
    </>
  );
}
