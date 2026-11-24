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
  salaryMin: number | null; salaryMax: number | null; company: { id: string; name: string }; skills: { skill: { name: string } }[] };
export function JobCard({ job, score }: { job: JobCardJob; score?: number }) {
  const salary = salaryRange(job.salaryMin, job.salaryMax);
  return (
    <article className="card group relative transition-colors hover:border-tide/60">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug">
            {/* o link cobre o cartão todo; o da empresa fica acima dele */}
            <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0 after:rounded-panel group-hover:text-deep">{job.title}</Link>
          </h3>
          <Link href={`/companies/${job.company.id}`} className="relative z-10 mt-0.5 inline-block text-sm text-abyss/70 hover:text-tide hover:underline">{job.company.name}</Link>
        </div>
        {score !== undefined && <ScoreRing score={score} />}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-abyss/85">
        <li className="flex items-center gap-1.5"><Pin />{job.location}</li>
        <li className="flex items-center gap-1.5"><Mode />{workModeLabel[job.workMode]}</li>
        <li className="flex items-center gap-1.5"><Doc />{contractLabel[job.contractType]}</li>
      </ul>
      {salary && <p className="tabular mt-2 text-sm font-medium text-abyss">{salary}</p>}
      {job.skills.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">
        {job.skills.slice(0, 5).map((s) => <span key={s.skill.name} className="chip">{s.skill.name}</span>)}
      </div>}
    </article>
  );
}

/** Foto ou logotipo servido por /api/images (com checagem de permissão). Sem imagem, mostra as iniciais. */
export function Avatar({ userId, name, version, size = 48 }: { userId: string; name: string; version?: Date | null; size?: number }) {
  const initials = name.replace(/\[[^\]]*\]/g, "").split(/\s+/).map((w) => w.match(/\p{L}/u)?.[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const box = { width: size, height: size };
  if (!version) return <span aria-hidden="true" style={box} className="inline-flex shrink-0 items-center justify-center rounded-full border border-mist bg-foam font-display text-sm font-semibold text-deep">{initials}</span>;
  // eslint-disable-next-line @next/next/no-img-element -- next/image exige o otimizador, que fica sem uso no projeto
  return <img src={`/api/images/${userId}?v=${version.getTime()}`} alt="" style={box} className="shrink-0 rounded-full border border-mist object-cover" />;
}
