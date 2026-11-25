import Link from "next/link";
import { ScoreRing } from "@/components/ui";
import { CompanyName } from "@/components/CompanyName";
import { computeCompatibility } from "@/modules/compatibility";

type PreviewJob = {
  id: string; title: string; area: string; workMode: string; location: string; minYears: number;
  company: { name: string }; skills: { skill: { name: string } }[];
};

const STEPS = ["Enviada", "Em análise", "Entrevista", "Aprovada"] as const;

/**
 * Exemplo real do diferencial: uma vaga publicada de verdade comparada com um perfil fictício,
 * pelas mesmas regras que a plataforma usa para todo mundo.
 */
export function CompatibilityPreview({ job }: { job: PreviewJob }) {
  const skills = job.skills.map((s) => s.skill.name);
  // perfil de exemplo: tem parte das habilidades pedidas e um pouco menos de experiência
  const profile = { skills: skills.slice(0, Math.max(1, skills.length - 1)), interestArea: job.area, workMode: job.workMode,
    location: job.location, yearsExperience: Math.max(0, job.minYears - 1) };
  const r = computeCompatibility(profile, { skills, area: job.area, workMode: job.workMode, location: job.location, minYears: job.minYears });

  return (
    <div className="card p-0">
      <div className="flex items-start gap-4 border-b border-mist p-5">
        <ScoreRing score={r.score} size={64} />
        <div className="min-w-0">
          <p className="text-xs text-abyss/60">Exemplo: perfil fictício comparado com uma vaga publicada</p>
          <p className="mt-1 font-semibold leading-snug"><Link href={`/jobs/${job.id}`} className="hover:text-tide">{job.title}</Link></p>
          <p className="text-sm text-abyss/65"><CompanyName name={job.company.name} /></p>
        </div>
      </div>
      <ul className="space-y-3 p-5">
        {r.criteria.map((c) => (
          <li key={c.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium">{c.label}</span>
              <span className="text-abyss/65">{c.detail}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist/70" aria-hidden="true">
              <div className={`h-full rounded-full ${c.ratio >= 1 ? "bg-reef" : c.ratio > 0 ? "bg-tide" : "bg-coral/70"}`} style={{ width: `${Math.max(4, c.ratio * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {r.missingSkills.length > 0 && (
        <p className="mx-5 rounded-control border border-coral/30 bg-coral/5 px-3 py-2 text-sm">
          <span className="font-medium text-coral">Falta para essa vaga:</span> {r.missingSkills.join(", ")}
        </p>
      )}
      <div className="p-5">
        <p className="text-sm font-medium text-abyss/80">Depois de se candidatar, cada etapa aparece assim</p>
        <ol className="mt-3 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4" aria-label="Etapas de uma candidatura">
          {STEPS.map((s, i) => (
            <li key={s} className={`rounded-full border px-2 py-1 text-center ${i < 2 ? "border-tide/40 bg-tide/10 text-deep" : i === 2 ? "border-reef/50 bg-reef/10 text-reef" : "border-mist text-abyss/60"}`}>
              <span className="sr-only">{i + 1}. </span>{s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
