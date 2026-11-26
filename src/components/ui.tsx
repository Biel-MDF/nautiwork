import { UserAvatar } from "./UserAvatar";
import { CompanyMark } from "./CompanyMark";
import { CompanyName } from "./CompanyName";
import { SaveIconButton } from "./SaveIconButton";
import { timeAgo } from "@/lib/display";
import Link from "next/link";
import { appStatusLabel, appStatusTone, contractLabel, salaryRange, workModeLabel } from "@/lib/labels";

export function StatusBadge({ status }: { status: keyof typeof appStatusLabel }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${appStatusTone[status]}`}>{appStatusLabel[status]}</span>;
}

export function Empty({ title, hint, href, cta }: { title: string; hint: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-panel border border-dashed border-mist bg-casco/60 px-6 py-10 text-center">
      <svg className="mx-auto mb-3 text-tide/70" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeOpacity=".35" />
        <circle cx="20" cy="20" r="11" stroke="currentColor" strokeOpacity=".6" />
        <circle cx="20" cy="20" r="3" fill="currentColor" />
      </svg>
      <p className="font-display font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-abyss/70">{hint}</p>
      {href && <Link href={href} className="btn-primary mt-5">{cta}</Link>}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="card"><p className="text-sm text-abyss/70">{label}</p><p className="tabular mt-2 font-display text-[32px] font-semibold leading-none">{value}</p></div>;
}

/** Leitura de compatibilidade em forma de anel de sonar: o arco cobre a porcentagem. */
export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = 20, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(100, score));
  const tone = pct >= 60 ? "text-reef" : pct >= 30 ? "text-tide" : "text-abyss/60";
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${tone}`} style={{ width: size, height: size }}
      role="img" aria-label={`Compatibilidade de ${pct}%`} title="Estimativa calculada pelas regras da plataforma">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeOpacity=".16" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      <span className="tabular absolute font-display text-[13px] font-semibold text-abyss">{pct}%</span>
    </span>
  );
}

const Pin = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-tide/80"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.8"/></svg>;
const Mode = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-tide/80"><rect x="3.5" y="5" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const Doc = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-tide/80"><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20V3.5Z" stroke="currentColor" strokeWidth="1.8"/><path d="M10 12h5M10 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;

type JobCardJob = { id: string; title: string; location: string; workMode: keyof typeof workModeLabel; contractType: keyof typeof contractLabel;
  salaryMin: number | null; salaryMax: number | null; publishedAt?: Date | null;
  company: { id: string; name: string; userId?: string; user?: { image: { updatedAt: Date } | null } };
  skills: { skill: { name: string } }[] };

/**
 * Cartão de vaga. Opcionais: score (compatibilidade, para candidato logado) e
 * save ("saved"/"unsaved" mostram o marcador; "login" leva ao login).
 * O conteúdo ocupa a altura toda e as habilidades descem para o pé, para a grade ficar alinhada.
 */
export function JobCard({ job, score, save }: { job: JobCardJob; score?: number; save?: "saved" | "unsaved" | "login" }) {
  const salary = salaryRange(job.salaryMin, job.salaryMax);
  const mark = job.company.userId;
  return (
    <article className="card group relative flex h-full flex-col transition-colors hover:border-tide/60">
      <div className="flex items-start gap-3">
        {mark && <CompanyMark userId={mark} name={job.company.name} imageVersion={job.company.user?.image ? job.company.user.image.updatedAt.getTime() : null} size={44} />}
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-snug">
            {/* o link cobre o cartão todo; empresa e marcador ficam acima dele */}
            <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0 after:rounded-panel group-hover:text-deep">{job.title}</Link>
          </h3>
          <Link href={`/companies/${job.company.id}`} className="relative z-10 mt-0.5 inline-block text-sm text-abyss/70 hover:text-tide hover:underline"><CompanyName name={job.company.name} /></Link>
        </div>
        {save && <div className="relative z-10 -mr-2 -mt-2"><SaveIconButton jobId={job.id} state={save} title={job.title} /></div>}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-abyss/85">
        <li className="flex items-center gap-1.5"><Pin />{job.location}</li>
        <li className="flex items-center gap-1.5"><Mode />{workModeLabel[job.workMode]}</li>
        <li className="flex items-center gap-1.5"><Doc />{contractLabel[job.contractType]}</li>
      </ul>
      <div className="mt-2 flex items-center justify-between gap-3">
          {salary ? <p className="tabular text-sm font-medium text-abyss">{salary}</p> : <p className="text-sm text-abyss/60">Salário não informado</p>}
          {score !== undefined && <span className="flex items-center gap-2 text-xs text-abyss/60">compatibilidade<ScoreRing score={score} size={44} /></span>}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        {job.skills.length > 0 ? <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((s) => <span key={s.skill.name} className="chip">{s.skill.name}</span>)}
        </div> : <span />}
        {job.publishedAt && <time dateTime={job.publishedAt.toISOString()} className="shrink-0 text-xs text-abyss/60">{timeAgo(job.publishedAt)}</time>}
      </div>
    </article>
  );
}

/** Foto ou logotipo servido por /api/images (com checagem de permissão). Sem imagem, a inicial na cor fixa da pessoa. */
export function Avatar({ userId, name, version, size = 48 }: { userId: string; name: string; version?: Date | null; size?: number }) {
  return <UserAvatar userId={userId} name={name} imageVersion={version ? version.getTime() : null} size={size} />;
}
