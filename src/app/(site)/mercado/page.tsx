import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { MarketExplorer, type AreaLive } from "@/components/market/MarketExplorer";
import { MARKET_AREAS, MARKET_TRENDS, MARKET_UPDATED, marketAreaOfJobArea } from "@/modules/market/areas";
import { areaStats } from "@/modules/public-data";
import { DemandChip } from "@/components/market/DemandChip";

// Estática, refeita no máximo a cada minuto (as contagens de vagas mudam; o resto é editorial).
// Servida pela CDN perto de quem acessa, sem esperar o servidor nem o banco.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Mercado de trabalho por área em 2026 — Nautiwork",
  description: "Cargos em alta, habilidades técnicas e comportamentais, ferramentas e tendências em 20 áreas, com as fontes de cada dado.",
  alternates: { canonical: "/mercado" },
};

export default async function Mercado() {
  const stats = await areaStats();

  // junta as áreas das vagas do Nautiwork nas 20 áreas do mercado
  const live: Record<string, AreaLive> = {};
  for (const s of stats) {
    const m = marketAreaOfJobArea(s.area);
    if (!m) continue;
    const cur = live[m.id] ?? { jobs: 0, skills: [] };
    cur.jobs += s.count;
    for (const k of s.topSkills) {
      const found = cur.skills.find((x) => x.name === k.name);
      if (found) found.n += k.n; else cur.skills.push({ ...k });
    }
    live[m.id] = cur;
  }
  for (const v of Object.values(live)) v.skills = v.skills.sort((a, b) => b.n - a.n).slice(0, 6);
  const openJobs = stats.reduce((t, s) => t + s.count, 0);

  return (
    <>
      <PageHeader title="Mercado" description="O que as empresas estão pedindo em 2026, área por área: cargos em alta, habilidades, ferramentas e tendências, comparados com as vagas abertas aqui."
        stats={[["Áreas analisadas", MARKET_AREAS.length], ["Vagas abertas no Nautiwork", openJobs]]} />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <section aria-labelledby="tendencias">
          <h2 id="tendencias" className="text-xl font-semibold sm:text-2xl">O que vale para todas as áreas</h2>
          {/* no celular os cartões rolam para o lado em vez de empilhar quatro telas */}
          <ul className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {MARKET_TRENDS.map((t) => (
              <li key={t.title} className="card flex w-[82%] shrink-0 snap-start flex-col sm:w-auto">
                <h3 className="font-semibold leading-snug">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-abyss/80">{t.text}</p>
                <a href={t.source.url} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-tide hover:underline">{t.source.title}</a>
              </li>
            ))}
          </ul>
        </section>

        <MarketExplorer live={live} />

        <section className="mt-14" aria-labelledby="comparar">
          <h2 id="comparar" className="text-xl font-semibold sm:text-2xl">Todas as áreas lado a lado</h2>
          <div className="mt-4 overflow-hidden rounded-panel border border-mist">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="hidden bg-casco text-xs text-abyss/70 md:table-header-group">
                <tr><th scope="col" className="px-4 py-3 font-medium">Área</th><th scope="col" className="px-4 py-3 font-medium">Demanda</th>
                  <th scope="col" className="px-4 py-3 font-medium">Habilidades em alta</th><th scope="col" className="px-4 py-3 text-right font-medium">Vagas aqui</th></tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {MARKET_AREAS.map((a) => (
                  <tr key={a.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 bg-casco/40 px-4 py-3 md:table-row md:p-0">
                    <th scope="row" className="font-semibold md:px-4 md:py-3"><Link href={`/mercado?area=${a.id}#area`} className="tap hover:text-tide hover:underline">{a.name}</Link></th>
                    <td className="text-right md:px-4 md:py-3 md:text-left"><DemandChip value={a.demand} /></td>
                    <td className="col-span-2 text-abyss/80 md:px-4 md:py-3">{a.hardSkills.slice(0, 3).join(" · ")}</td>
                    <td className="tabular col-span-2 text-abyss/70 md:px-4 md:py-3 md:text-right">
                      {(live[a.id]?.jobs ?? 0) > 0 ? <Link href={`/jobs?mercado=${a.id}`} className="tap font-semibold text-tide hover:underline">{live[a.id].jobs} {live[a.id].jobs === 1 ? "vaga" : "vagas"}</Link> : <span className="whitespace-nowrap">nenhuma ainda</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-[80ch] text-sm leading-relaxed text-abyss/65">Conteúdo reunido de relatórios e reportagens publicados em 2026 (LinkedIn, Robert Half, CNI, Confea, Figma e outros, com links em cada área). Atualizado em {MARKET_UPDATED}. Serve para orientar estudo e carreira, não é previsão. As vagas contadas são as abertas no Nautiwork agora.</p>
        </section>
      </main>
    </>
  );
}
