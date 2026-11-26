"use client";
// Seção "Saiba o quanto combina": barra de ícones (transparente, só ícone) que troca entre
// a análise do perfil, o panorama real das vagas abertas, o mercado por área e as regras.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MARKET_AREAS } from "@/modules/market/areas";
import { AreaChart } from "@/components/market/AreaChart";
import { DemandChip } from "@/components/market/DemandChip";
import { AnalysisPanel, type MatchForm } from "./MatchSimulator";

export type Panorama = {
  total: number;
  modes: { label: string; n: number }[];
  contracts: { label: string; n: number }[];
  skills: { name: string; n: number }[];
  noExperience: number;
  withSalary: number;
};

type View = "analise" | "panorama" | "mercado" | "regras";

const ICONS: Record<View, React.ReactNode> = {
  analise: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
  panorama: <><path d="M4 20h16" /><path d="M7 16V10" /><path d="M12 16V5" /><path d="M17 16v-4" /></>,
  mercado: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /><path d="M12 4c2.5 2.2 3.5 5 3.5 8s-1 5.8-3.5 8c-2.5-2.2-3.5-5-3.5-8s1-5.8 3.5-8Z" /></>,
  regras: <><path d="M12 4v16" /><path d="M5 8h14" /><path d="m5 8-2.5 6a3 3 0 0 0 5 0L5 8Zm14 0-2.5 6a3 3 0 0 0 5 0L19 8Z" /><path d="M8 20h8" /></>,
};
const LABELS: Record<View, string> = { analise: "Sua análise", panorama: "Panorama das vagas", mercado: "Mercado por área", regras: "Como calculamos" };
const ORDER: View[] = ["analise", "panorama", "mercado", "regras"];

function Bars({ items, total, unit = "vagas" }: { items: { label: string; n: number }[]; total: number; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{i.label}</span>
            <span className="tabular shrink-0 text-abyss/70"><strong className="font-semibold text-abyss">{i.n}</strong> {unit}{total ? ` · ${Math.round((i.n / total) * 100)}%` : ""}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-mist/60" aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${(i.n / max) * 100}%`, backgroundImage: "linear-gradient(90deg, rgb(var(--c-accent)), rgb(var(--c-accentb)))" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PanoramaPanel({ p }: { p: Panorama }) {
  if (p.total === 0) return <div className="card text-sm text-abyss/70">Ainda não há vagas abertas para analisar.</div>;
  const pct = (n: number) => `${Math.round((n / p.total) * 100)}%`;
  return (
    <div className="card space-y-6">
      <div>
        <p className="font-semibold">Panorama real das {p.total} vagas abertas</p>
        <p className="mt-1 text-sm text-abyss/70">Calculado agora a partir das vagas publicadas no Nautiwork.</p>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-control border border-mist bg-foam/50 p-3"><dt className="text-xs text-abyss/70">Não exigem experiência</dt><dd className="tabular font-display text-2xl font-semibold">{pct(p.noExperience)}</dd></div>
        <div className="rounded-control border border-mist bg-foam/50 p-3"><dt className="text-xs text-abyss/70">Mostram salário</dt><dd className="tabular font-display text-2xl font-semibold">{pct(p.withSalary)}</dd></div>
      </dl>
      <section><h3 className="mb-3 text-sm font-medium text-abyss/70">Habilidades mais pedidas</h3><Bars items={p.skills.map((s) => ({ label: s.name, n: s.n }))} total={p.total} /></section>
      <div className="grid gap-6 sm:grid-cols-2">
        <section><h3 className="mb-3 text-sm font-medium text-abyss/70">Modalidade</h3><Bars items={p.modes} total={p.total} /></section>
        <section><h3 className="mb-3 text-sm font-medium text-abyss/70">Contratação</h3><Bars items={p.contracts} total={p.total} /></section>
      </div>
      <Link href="/jobs" className="btn-ghost w-full">Ver todas as vagas</Link>
    </div>
  );
}

function MarketPanel({ live }: { live: Record<string, number> }) {
  const [i, setI] = useState(0);
  const area = MARKET_AREAS[i];
  const move = (d: number) => setI((x) => (x + d + MARKET_AREAS.length) % MARKET_AREAS.length);
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => move(-1)} className="btn-ghost h-11 w-11 shrink-0 p-0" aria-label="Área anterior">‹</button>
        <label className="sr-only" htmlFor="mercado-area">Área</label>
        <select id="mercado-area" value={area.id} onChange={(e) => setI(MARKET_AREAS.findIndex((a) => a.id === e.target.value))} className="input flex-1 font-semibold">
          {MARKET_AREAS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button type="button" onClick={() => move(1)} className="btn-ghost h-11 w-11 shrink-0 p-0" aria-label="Próxima área">›</button>
      </div>
      <div aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-semibold">{area.name}</h3>
          <DemandChip value={area.demand} />
          <span className="tabular ml-auto text-xs text-abyss/60">{i + 1} de {MARKET_AREAS.length}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-abyss/80">{area.summary}</p>
      </div>
      <AreaChart area={area} compact />
      <div>
        <p className="text-sm font-medium text-abyss/70">Habilidades em alta</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">{area.hardSkills.slice(0, 4).map((s) => <li key={s} className="chip py-1 text-sm">{s}</li>)}</ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/mercado?area=${area.id}#area`} className="btn-primary">Análise completa</Link>
        {(live[area.id] ?? 0) > 0 && <Link href={`/jobs?mercado=${area.id}`} className="btn-ghost">{live[area.id]} {live[area.id] === 1 ? "vaga aberta" : "vagas abertas"}</Link>}
      </div>
    </div>
  );
}

const WEIGHTS = [["Habilidades", 50], ["Área de interesse", 20], ["Modalidade", 10], ["Cidade", 10], ["Experiência", 10]] as const;
const STEPS = ["Enviada", "Em análise", "Entrevista", "Aprovada"];

function RulesPanel() {
  return (
    <div className="card space-y-6">
      <div>
        <p className="font-semibold">Como a nota é calculada</p>
        <p className="mt-1 text-sm text-abyss/70">Regras fixas e iguais para todo mundo, sem IA. Critério sem dado no perfil ou na vaga sai da conta e os outros são reajustados. Cidade não conta em vaga remota.</p>
      </div>
      <Bars items={WEIGHTS.map(([label, n]) => ({ label, n }))} total={0} unit="pontos" />
      <div>
        <p className="text-sm font-medium text-abyss/70">Depois de se candidatar, cada etapa aparece assim</p>
        <ol className="mt-3 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4" aria-label="Etapas de uma candidatura">
          {STEPS.map((s, i) => (
            <li key={s} className={`rounded-full border px-2 py-1 text-center ${i < 2 ? "border-tide/40 bg-tide/10 text-deep" : i === 2 ? "border-reef/50 bg-reef/10 text-reef" : "border-mist text-abyss/60"}`}>
              <span className="sr-only">{i + 1}. </span>{s}
            </li>
          ))}
        </ol>
      </div>
      <Link href="/about#calc" className="text-sm font-semibold text-tide hover:underline">Ler a explicação completa</Link>
    </div>
  );
}

export function InsightPanel({ panorama, live, ...analysis }: {
  panorama: Panorama; live: Record<string, number>; skillOptions: string[]; areaOptions: string[]; cityOptions: string[]; prefill?: MatchForm | null;
}) {
  const [view, setView] = useState<View>("analise");
  const rail = useRef<HTMLDivElement>(null);

  // lembra a última aba aberta nesta visita
  useEffect(() => { try { const v = sessionStorage.getItem("nw-insight") as View | null; if (v && ORDER.includes(v)) setView(v); } catch { /* */ } }, []);
  function choose(v: View) { setView(v); try { sessionStorage.setItem("nw-insight", v); } catch { /* */ } }

  // setas do teclado navegam entre os ícones, como em abas
  function onKey(e: React.KeyboardEvent) {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = ORDER[(ORDER.indexOf(view) + d + ORDER.length) % ORDER.length];
    choose(next);
    rail.current?.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)?.focus();
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start">
      <div ref={rail} role="tablist" aria-label="O que ver" aria-orientation="vertical" onKeyDown={onKey}
        className="flex shrink-0 gap-1 self-start rounded-full border border-mist/50 bg-casco/30 p-1.5 backdrop-blur-sm md:sticky md:top-24 md:flex-col">
        {ORDER.map((v) => (
          <button key={v} type="button" role="tab" data-view={v} aria-selected={view === v} aria-controls="insight-panel" aria-label={LABELS[v]} title={LABELS[v]}
            tabIndex={view === v ? 0 : -1} onClick={() => choose(v)}
            className={`group relative flex h-11 w-11 items-center justify-center rounded-full transition-colors ${view === v ? "bg-foam text-tide shadow-[inset_0_0_0_1px_rgb(var(--c-tide)/0.5)]" : "text-abyss/65 hover:bg-foam/60 hover:text-abyss"}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[v]}</svg>
            {/* rótulo que aparece ao passar o mouse, só no computador */}
            <span className={`pointer-events-none absolute left-full top-1/2 z-10 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-mist bg-casco px-2 py-1 text-xs font-medium text-abyss opacity-0 shadow transition-opacity group-hover:opacity-100 ${view === v ? "md:hidden" : "md:block"}`}>{LABELS[v]}</span>
          </button>
        ))}
      </div>
      <div id="insight-panel" role="tabpanel" aria-label={LABELS[view]} className="min-w-0 flex-1">
        <p className="mb-2 text-sm font-semibold text-abyss/80 md:hidden">{LABELS[view]}</p>
        <div hidden={view !== "analise"}><AnalysisPanel {...analysis} /></div>
        {view === "panorama" && <PanoramaPanel p={panorama} />}
        {view === "mercado" && <MarketPanel live={live} />}
        {view === "regras" && <RulesPanel />}
      </div>
    </div>
  );
}
