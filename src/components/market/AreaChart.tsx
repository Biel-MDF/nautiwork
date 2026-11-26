// Gráfico de barras dos indicadores de uma área (1 a 5), com a média das 20 áreas marcada
// em cada linha para comparar. Feito com HTML e CSS: lê bem em leitor de tela e em qualquer tema.
import { INDICATOR_LABELS, MARKET_AREAS, type Indicators, type MarketArea } from "@/modules/market/areas";

const KEYS = Object.keys(INDICATOR_LABELS) as (keyof Indicators)[];
const AVG = Object.fromEntries(KEYS.map((k) => [k, MARKET_AREAS.reduce((t, a) => t + a.indicators[k], 0) / MARKET_AREAS.length])) as Indicators;

export function AreaChart({ area, compact = false }: { area: MarketArea; compact?: boolean }) {
  return (
    <figure className="m-0">
      <ul className={compact ? "space-y-3" : "space-y-4"} aria-label={`Indicadores de ${area.name}, de 1 a 5`}>
        {KEYS.map((k) => {
          const v = area.indicators[k];
          const avg = AVG[k];
          return (
            <li key={k}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium" title={INDICATOR_LABELS[k].hint}>{INDICATOR_LABELS[k].label}</span>
                <span className="tabular text-abyss/70"><strong className="font-semibold text-abyss">{v}</strong>/5{v > avg + 0.4 ? " · acima da média" : v < avg - 0.4 ? " · abaixo da média" : ""}</span>
              </div>
              <div className="relative mt-1.5 h-2.5 rounded-full bg-mist/60" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${(v / 5) * 100}%`, backgroundImage: "linear-gradient(90deg, rgb(var(--c-accent)), rgb(var(--c-accentb)))" }} />
                {/* traço = média das 20 áreas */}
                <span className="absolute -top-1 h-[18px] w-0.5 rounded bg-abyss/70" style={{ left: `calc(${(avg / 5) * 100}% - 1px)` }} />
              </div>
              {!compact && <p className="mt-1 text-xs text-abyss/60">{INDICATOR_LABELS[k].hint}</p>}
            </li>
          );
        })}
      </ul>
      <figcaption className="mt-3 flex items-center gap-2 text-xs text-abyss/60">
        <span className="inline-block h-3 w-0.5 rounded bg-abyss/70" aria-hidden="true" />
        Média das {MARKET_AREAS.length} áreas. Notas da equipe a partir das fontes da área, não são medição oficial.
      </figcaption>
    </figure>
  );
}
