// Detalhe de uma vaga: usado na página da vaga e no painel ao lado da lista (/jobs).
import Link from "next/link";
import { currentUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { jobPublic } from "@/modules/public-data";
import { ApplyButton, SaveButton } from "@/components/forms";
import { ScoreRing, JobTags } from "@/components/ui";
import { JobSafety } from "@/components/jobs/JobSafety";
import { commuteFor } from "@/modules/geo";
import { contractLabel, salaryRange, seniorityLabel, workModeLabel } from "@/lib/labels";
import { computeCompatibility } from "@/modules/compatibility";
import { CompanyName } from "@/components/CompanyName";
import { ResponseBadge } from "@/components/ResponseBadge";
import { responseStats } from "@/modules/hiring";

/** Carrega a vaga com o que a pessoa logada pode ver dela; null se ela não pode ver. */
export async function loadJobDetail(id: string) {
  const [job, me] = await Promise.all([jobPublic(id), currentUser()]);
  // currentUser respeita o modo de visualização do admin
  const session = me ? { user: { id: me.id, role: me.role } } : null;
  const isOwner = job && session?.user.id === job.company.userId;
  if (!job) return null;
  if (!isOwner && session?.user.role !== "ADMIN" && (job.flagged || job.status === "CLOSED")) {
    // vaga encerrada continua visível para quem se candidatou, com o aviso de encerrada;
    // vaga retida pela moderação some para todos, menos a empresa e o admin
    if (job.flagged || session?.user.role !== "CANDIDATE") return null;
    const mine = await db.jobApplication.count({ where: { jobId: job.id, candidate: { userId: session.user.id } } });
    if (!mine) return null;
  }

  const response = (await responseStats([job.company.id])).get(job.company.id) ?? null;
  let compat = null, applied = false, saved = false, commute: number | null = null;
  if (session?.user.role === "CANDIDATE") {
    const p = await db.candidateProfile.findUnique({ where: { userId: session.user.id }, include: { skills: { include: { skill: true } } } });
    if (p) {
      if (p.lat != null && p.lng != null) commute = commuteFor({ lat: p.lat, lng: p.lng }, { lat: job.lat, lng: job.lng, workMode: job.workMode })?.minutes ?? null;
      compat = computeCompatibility(
        { skills: p.skills.map((s) => s.skill.name), interestArea: p.interestArea, workMode: p.workMode, location: p.location, yearsExperience: p.yearsExperience },
        { skills: job.skills.map((s) => s.skill.name), area: job.area, workMode: job.workMode, location: job.location, minYears: job.minYears });
      const [a, s] = await Promise.all([
        db.jobApplication.findUnique({ where: { jobId_candidateId: { jobId: job.id, candidateId: p.id } }, select: { id: true } }),
        db.savedJob.findUnique({ where: { candidateId_jobId: { candidateId: p.id, jobId: job.id } }, select: { jobId: true } }),
      ]);
      applied = !!a; saved = !!s;
    }
  }
  return { job, session, compat, applied, saved, response, commute };
}

export type JobDetailData = NonNullable<Awaited<ReturnType<typeof loadJobDetail>>>;

function Actions({ d, className = "" }: { d: JobDetailData; className?: string }) {
  const { job, session, applied, saved } = d;
  return (
    <div className={className}>
      {session?.user.role === "COMPANY" || session?.user.role === "ADMIN" ? <p className="text-sm text-abyss/80">Só contas de candidato podem se candidatar.</p> : (
        <>
          {job.status === "ACTIVE" && <ApplyButton jobId={job.id} applied={applied} loggedIn={!!session} />}
          {session?.user.role === "CANDIDATE" && <SaveButton jobId={job.id} saved={saved} />}
        </>
      )}
    </div>
  );
}

function Compat({ d }: { d: JobDetailData }) {
  const { compat, session } = d;
  if (!compat) return session?.user.role === "CANDIDATE"
    ? <p className="card text-sm">Complete seu perfil para ver a compatibilidade. <Link className="font-semibold text-tide hover:underline" href="/candidate/profile">Ir para o perfil</Link></p>
    : null;
  return (
    <section className="card" aria-labelledby={`compat-${d.job.id}`}>
      <div className="flex items-center gap-4">
        <ScoreRing score={compat.score} size={72} />
        <div><h2 id={`compat-${d.job.id}`} className="font-semibold">Compatibilidade</h2>
          <p className="mt-0.5 text-xs leading-snug text-abyss/60">Estimativa por regras. Não mede sua capacidade profissional.</p></div>
      </div>
      <ul className="mt-5 space-y-3.5 text-sm">{compat.criteria.map((c) => (
        <li key={c.key}>
          <div className="flex items-baseline justify-between gap-3"><span className="font-medium">{c.label}</span><span className="tabular text-xs text-abyss/60">peso {c.weight}</span></div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foam" aria-hidden="true"><div className={`h-full rounded-full ${c.ratio >= 1 ? "bg-reef" : c.ratio > 0 ? "bg-tide" : "bg-transparent"}`} style={{ width: `${Math.round(c.ratio * 100)}%` }} /></div>
          <p className="mt-1 text-abyss/70">{c.detail}</p>
        </li>))}</ul>
      {compat.missingSkills.length > 0 && <div className="mt-5 border-t border-mist pt-4 text-sm"><p className="font-medium">Habilidades que faltam no seu perfil</p>
        <div className="mt-2 flex flex-wrap gap-1.5">{compat.missingSkills.map((m) => <span key={m} className="chip border-coral/30 text-coral">{m}</span>)}</div></div>}
    </section>
  );
}

function Body({ d, headingLevel }: { d: JobDetailData; headingLevel: "h2" | "h3" }) {
  const { job } = d;
  const H = headingLevel;
  const block = (t: string, c?: string | null) => c ? <section className="mt-7"><H className="text-lg font-semibold">{t}</H><p className="mt-2 max-w-[68ch] whitespace-pre-line leading-relaxed text-abyss/85">{c}</p></section> : null;
  return (
    <>
      {block("Sobre a vaga", job.description)}{block("Responsabilidades", job.responsibilities)}{block("Requisitos", job.requirements)}{block("Benefícios", job.benefits)}
      {job.skills.length > 0 && <section className="mt-7"><H className="text-lg font-semibold">Habilidades pedidas</H>
        <div className="mt-3 flex flex-wrap gap-2">{job.skills.map((s) => <span key={s.skillId} className="chip px-2.5 py-1 text-sm">{s.skill.name}</span>)}</div></section>}
    </>
  );
}

function Facts({ d, cols }: { d: JobDetailData; cols: string }) {
  const { job } = d;
  const facts: [string, string][] = [
    ["Modalidade", workModeLabel[job.workMode]], ["Contratação", contractLabel[job.contractType]],
    ["Nível", seniorityLabel[job.seniority]], ["Salário", salaryRange(job.salaryMin, job.salaryMax) ?? "Não informado"],
  ];
  return (
    <dl className={`grid gap-px overflow-hidden rounded-panel border border-mist bg-mist ${cols}`}>
      {facts.map(([k, v]) => <div key={k} className="bg-casco px-4 py-3"><dt className="text-xs text-abyss/60">{k}</dt><dd className="tabular mt-1 text-sm font-semibold">{v}</dd></div>)}
    </dl>
  );
}

const Pin = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-tide/80"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.8"/></svg>;

function Where({ d, className }: { d: JobDetailData; className: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 ${className}`}><Pin />{d.job.location}
      {d.commute != null && <span className="text-abyss/70" title="Estimativa em linha reta a partir do seu CEP, com transporte público. Pode variar.">· cerca de {d.commute} min da sua casa</span>}</p>
  );
}

function StatusNote({ d }: { d: JobDetailData }) {
  return d.job.status !== "ACTIVE" ? <p role="status" className="mb-5 rounded-control border border-coral/40 bg-coral/10 p-3 text-sm text-coral">Esta vaga está {d.job.status === "PAUSED" ? "pausada" : "encerrada"} e não recebe candidaturas.</p> : null;
}

/** Página inteira da vaga (/jobs/[id]). */
export function JobDetailPage({ d }: { d: JobDetailData }) {
  const { job } = d;
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 pb-32 pt-8 lg:grid-cols-[1fr_340px] lg:pb-10">
      <article className="min-w-0">
        <StatusNote d={d} />
        <div className="flex flex-wrap items-center gap-2"><Link href={`/companies/${job.company.id}`} className="text-sm font-medium text-tide hover:text-deep hover:underline"><CompanyName name={job.company.name} /></Link><ResponseBadge stats={d.response} compact /></div>
        <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-[40px]">{job.title}</h1>
        <Where d={d} className="mt-2 text-abyss/75" />
        <JobTags job={job} className="mt-3" />
        <div className="mt-6"><Facts d={d} cols="grid-cols-2 sm:grid-cols-4" /></div>
        <Body d={d} headingLevel="h2" />
      </article>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Actions d={d} className="card space-y-3 [&_.btn-ghost]:w-full [&_.btn-primary]:w-full max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20 max-lg:flex max-lg:items-start max-lg:gap-2 max-lg:space-y-0 max-lg:rounded-none max-lg:border-x-0 max-lg:border-b-0 max-lg:bg-fossa/95 max-lg:px-4 max-lg:py-3 max-lg:backdrop-blur-md max-lg:[&>*]:flex-1" />
        <Compat d={d} />
        {d.session?.user.role !== "COMPANY" && d.session?.user.role !== "ADMIN" && <Link href={`/assistente?modo=entrevista&vaga=${job.id}`} className="btn-ghost w-full">Treinar a entrevista com IA</Link>}
        <JobSafety jobId={job.id} title={job.title} loggedIn={!!d.session} own={d.session?.user.id === job.company.userId} />
      </aside>
    </main>
  );
}

/** Painel ao lado da lista de vagas: o essencial para decidir sem sair da busca. */
export function JobDetailPanel({ d }: { d: JobDetailData }) {
  const { job } = d;
  return (
    <article aria-labelledby={`panel-${job.id}`} className="overflow-hidden rounded-panel border border-mist bg-casco">
      <header className="border-b border-mist p-5">
        <StatusNote d={d} />
        <div className="flex flex-wrap items-center gap-2"><Link href={`/companies/${job.company.id}`} className="text-sm font-medium text-tide hover:text-deep hover:underline"><CompanyName name={job.company.name} /></Link><ResponseBadge stats={d.response} compact /></div>
        <h2 id={`panel-${job.id}`} className="mt-1.5 text-2xl font-semibold leading-tight">{job.title}</h2>
        <Where d={d} className="mt-1.5 text-sm text-abyss/75" />
        <JobTags job={job} className="mt-2.5" />
        <Actions d={d} className="mt-4 flex flex-wrap items-start gap-2 [&>*]:min-w-[160px] [&>*]:flex-1" />
      </header>
      <div className="p-5">
        <Facts d={d} cols="grid-cols-2 xl:grid-cols-4" />
        {d.compat && <div className="mt-5"><Compat d={d} /></div>}
        <Body d={d} headingLevel="h3" />
        <div className="mt-7 space-y-3">{d.session?.user.role !== "COMPANY" && d.session?.user.role !== "ADMIN" && <Link href={`/assistente?modo=entrevista&vaga=${job.id}`} className="btn-ghost w-full">Treinar a entrevista com IA</Link>}<JobSafety jobId={job.id} title={job.title} loggedIn={!!d.session} own={d.session?.user.id === job.company.userId} /></div>
        <Link href={`/jobs/${job.id}`} className="btn-ghost mt-7 w-full">Abrir a página da vaga</Link>
      </div>
    </article>
  );
}
