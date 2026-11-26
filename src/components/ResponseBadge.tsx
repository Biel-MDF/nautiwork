import type { ResponseStats } from "@/modules/hiring";

/** Selo "Responde candidatos": 80% ou mais das candidaturas respondidas, em até 7 dias na mediana. */
export function ResponseBadge({ stats, compact = false }: { stats: ResponseStats | null; compact?: boolean }) {
  if (!stats) return compact ? null : <span className="chip">Sem histórico de respostas ainda</span>;
  if (stats.badge) return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-reef/50 bg-reef/10 px-2.5 py-1 text-xs font-semibold text-abyss"
      title={`Respondeu ${stats.rate}% de ${stats.decided} candidaturas, em ${stats.medianDays} dias na mediana`}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-reef" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
      Responde candidatos{!compact && <span className="font-normal text-abyss/70">· {stats.rate}% em até {stats.medianDays} {stats.medianDays === 1 ? "dia" : "dias"}</span>}
    </span>);
  if (compact) return null;
  return <span className="chip" title={`Base: ${stats.decided} candidaturas dos últimos 6 meses`}>Responde {stats.rate}% das candidaturas</span>;
}
