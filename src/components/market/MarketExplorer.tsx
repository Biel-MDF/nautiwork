"use client";
// Escolha de área + tabela do que o mercado pede nela. A área escolhida vai para a URL
// (?area=), então dá para compartilhar o link de uma área específica.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MARKET_AREAS } from "@/modules/market/areas";
import { DemandChip } from "./DemandChip";
import { AreaChart } from "./AreaChart";

export type AreaLive = { jobs: number; skills: { name: string; n: number }[] };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
      <dt className="text-sm font-medium text-abyss/65">{label}</dt>
      <dd className="min-w-0 text-[15px] leading-relaxed">{children}</dd>
    </div>
  );
}
const Chips = ({ items, tone = "" }: { items: string[]; tone?: string }) => (
  <ul className="flex flex-wrap gap-1.5">{items.map((s) => <li key={s} className={`chip py-1 text-sm ${tone}`}>{s}</li>)}</ul>
);

export function MarketExplorer({ initial, live }: { initial: string; live: Record<string, AreaLive> }) {
  const [id, setId] = useState(initial);
  const router = useRouter();
  const path = usePathname();
  const area = MARKET_AREAS.find((a) => a.id === id) ?? MARKET_AREAS[0];
  const here = live[area.id];
  const list = useRef<HTMLDivElement>(null);

  // no celular a lista de áreas rola para o lado: mostra a área escolhida
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (el && list.current && list.current.scrollWidth > list.current.clientWidth) list.current.scrollTo({ left: el.offsetLeft - 16, behavior: "smooth" });
  }, [id]);

  function choose(next: string) {
    setId(next);
    router.replace(`${path}?area=${next}`, { scroll: false });
  }

  return (
    <section id="area" className="mt-14 scroll-mt-24" aria-labelledby="area-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="area-title" className="text-xl font-semibold sm:text-2xl">Escolha a área</h2>
        <Link href="/#como-funciona" className="tap text-sm font-semibold text-tide hover:underline">Comparar com o meu perfil</Link>
      </div>

      {/* celular: lista horizontal que rola; computador: coluna à esquerda */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[250px_1fr] lg:gap-6">
        <div ref={list} role="tablist" aria-label="Áreas do mercado" aria-orientation="vertical"
          className="relative -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {MARKET_AREAS.map((a) => {
            const on = a.id === area.id;
            return (
              <button key={a.id} type="button" role="tab" aria-selected={on} aria-controls="area-panel" onClick={() => choose(a.id)}
                className={`flex shrink-0 snap-start items-center justify-between gap-3 rounded-control border px-3.5 py-2 text-left text-sm transition-colors lg:w-full
                  ${on ? "border-tide/60 bg-foam font-semibold text-abyss" : "border-mist bg-casco/50 text-abyss/80 hover:border-tide/40 hover:text-abyss"}`}>
                <span className="whitespace-nowrap lg:whitespace-normal">{a.name}</span>
                <span className="tabular hidden text-xs text-abyss/60 lg:inline">{live[a.id]?.jobs ?? 0}</span>
              </button>
            );
          })}
        </div>

        <article id="area-panel" role="tabpanel" aria-label={area.name} className="min-w-0 overflow-hidden rounded-panel border border-mist bg-casco">
          <header className="border-b border-mist px-5 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-2xl font-semibold">{area.name}</h3>
              <DemandChip value={area.demand} />
            </div>
            <p className="mt-2 max-w-[70ch] leading-relaxed text-abyss/80">{area.summary}</p>
          </header>
          <dl className="divide-y divide-mist">
            <Row label="Indicadores"><div className="max-w-xl"><AreaChart area={area} /></div></Row>
            <Row label="Cargos em alta"><Chips items={area.roles} /></Row>
            <Row label="Habilidades técnicas"><Chips items={area.hardSkills} tone="border-tide/30" /></Row>
            <Row label="Comportamentais"><Chips items={area.softSkills} /></Row>
            <Row label="Ferramentas e certificações"><Chips items={area.tools} /></Row>
            <Row label="Tendência">{area.trend}</Row>
            <Row label="Como começar">{area.start}</Row>
            <Row label="No Nautiwork agora">
              {here && here.jobs > 0 ? (
                <div className="space-y-2">
                  <p><Link href={`/jobs?mercado=${area.id}`} className="font-semibold text-tide hover:underline">{here.jobs} {here.jobs === 1 ? "vaga aberta" : "vagas abertas"}</Link> nessa área. Habilidades mais pedidas nelas:</p>
                  <ul className="flex flex-wrap gap-1.5">{here.skills.map((s) => <li key={s.name} className="chip py-1 text-sm">{s.name}<span className="tabular ml-1 text-abyss/60">{s.n}</span></li>)}</ul>
                </div>
              ) : <span className="text-abyss/70">Nenhuma vaga aberta nessa área por enquanto.</span>}
            </Row>
            <Row label="Fontes">
              <ul className="space-y-1 text-sm">{area.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-tide hover:underline">{s.title}</a></li>)}</ul>
            </Row>
          </dl>
        </article>
      </div>
    </section>
  );
}
