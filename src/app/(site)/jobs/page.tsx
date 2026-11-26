import Link from "next/link";
import { Suspense } from "react";
import { Empty, JobCard } from "@/components/ui";
import { jobsPublic } from "@/modules/public-data";
import { jobViewer } from "@/modules/viewer";
import { PageHeader } from "@/components/PageHeader";
import { MARKET_AREAS } from "@/modules/market/areas";
import { JobDetailPanel, loadJobDetail } from "@/components/jobs/JobDetail";
import { FiltersToggle, JobsBoard, ViewSwitcher } from "@/components/jobs/JobsBoard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vagas — Nautiwork", description: "Vagas por cargo, cidade, modalidade, contratação, nível e salário. Veja o quanto cada uma combina com o seu perfil.", alternates: { canonical: "/jobs" } };

const FILTER_KEYS = ["q", "area", "mercado", "location", "workMode", "contractType", "minSalary", "seniority", "noExp", "days"];

export default async function Jobs(props: { searchParams: Promise<Record<string, string>> }) {
  const searchParams = await props.searchParams;
  const { vaga, ...rest } = searchParams;
  const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));
  const [{ parsed, total, remote, internships, hiring, noExp }, viewer] = await Promise.all([jobsPublic(clean), jobViewer()]);
  const qs = (page: number) => new URLSearchParams({ ...clean, page: String(page) }).toString();
  const active = FILTER_KEYS.filter((k) => clean[k]).length;

  // a vaga aberta ao lado: a escolhida (se estiver nesta página) ou a primeira da lista
  const items = parsed?.items ?? [];
  const selectedId = items.some((j) => j.id === vaga) ? vaga! : items[0]?.id;
  const detail = selectedId ? await loadJobDetail(selectedId) : null;

  const shortcuts: [string, Record<string, string>, number][] = [["Remotas", { workMode: "REMOTE" }, remote], ["Estágio", { contractType: "INTERNSHIP" }, internships], ["Sem experiência", { noExp: "1" }, noExp], ["Publicadas nesta semana", { days: "7" }, -1]];
  return (
    <>
      <PageHeader title="Vagas" description="Busque por cargo, cidade, modalidade, tipo de contratação e salário. Com perfil preenchido, cada vaga mostra o quanto combina com você."
        stats={[["Vagas abertas", total], ["Remotas", remote], ["Empresas contratando", hiring]]}>
        <nav aria-label="Atalhos de busca" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {shortcuts.map(([label, params, n]) => {
            const on = Object.entries(params).every(([k, v]) => clean[k] === v);
            return <Link key={label} href={`/jobs?${new URLSearchParams(params)}`} aria-current={on ? "true" : undefined}
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${on ? "border-tide/60 bg-foam text-abyss" : "border-mist text-abyss/75 hover:border-tide/50 hover:text-abyss"}`}>
              {label}{n >= 0 && <span className="tabular text-abyss/60">{n}</span>}</Link>;
          })}
        </nav>
      </PageHeader>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <FiltersToggle active={active}>
          <form className="card" role="search" aria-label="Filtros">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.2fr_1fr_1fr_auto] lg:items-end">
              <div><label className="label" htmlFor="q">Palavra-chave</label><input id="q" name="q" defaultValue={clean.q} className="input" placeholder="Cargo, empresa, habilidade" /></div>
              <div><label className="label" htmlFor="location">Cidade</label><input id="location" name="location" defaultValue={clean.location} className="input" /></div>
              <div><label className="label" htmlFor="workMode">Modalidade</label><select id="workMode" name="workMode" defaultValue={clean.workMode ?? ""} className="input"><option value="">Todas</option><option value="REMOTE">Remoto</option><option value="HYBRID">Híbrido</option><option value="ONSITE">Presencial</option></select></div>
              <div><label className="label" htmlFor="contractType">Contratação</label><select id="contractType" name="contractType" defaultValue={clean.contractType ?? ""} className="input"><option value="">Todas</option><option value="CLT">CLT</option><option value="PJ">PJ</option><option value="INTERNSHIP">Estágio</option><option value="TEMPORARY">Temporário</option></select></div>
              <button className="btn-primary w-full sm:col-span-2 lg:col-span-1 lg:w-auto">Buscar</button>
            </div>
            <details className="group mt-3" open={["area", "mercado", "minSalary", "seniority", "noExp", "days"].some((k) => clean[k]) || undefined}>
              <summary className="inline-flex min-h-[40px] cursor-pointer list-none items-center gap-2 text-sm font-medium text-tide">
                <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span>Mais filtros
              </summary>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
                <div><label className="label" htmlFor="mercado">Área de mercado</label><select id="mercado" name="mercado" defaultValue={clean.mercado ?? ""} className="input"><option value="">Todas</option>{MARKET_AREAS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                <div><label className="label" htmlFor="area">Área (texto livre)</label><input id="area" name="area" defaultValue={clean.area} className="input" /></div>
                <div><label className="label" htmlFor="seniority">Nível</label><select id="seniority" name="seniority" defaultValue={clean.seniority ?? ""} className="input"><option value="">Todos</option><option value="INTERN">Estagiário</option><option value="JUNIOR">Júnior</option><option value="MID">Pleno</option><option value="SENIOR">Sênior</option><option value="LEAD">Liderança</option></select></div>
                <div><label className="label" htmlFor="minSalary">Salário a partir de (R$)</label><input id="minSalary" name="minSalary" type="number" min={1} defaultValue={clean.minSalary} className="input" /></div>
                <div><label className="label" htmlFor="days">Publicada nos últimos</label><select id="days" name="days" defaultValue={clean.days ?? ""} className="input"><option value="">Qualquer data</option><option value="1">1 dia</option><option value="7">7 dias</option><option value="30">30 dias</option></select></div>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" name="noExp" value="1" defaultChecked={clean.noExp === "1"} className="h-5 w-5 accent-tide" />Só vagas sem experiência exigida</label>
              </div>
            </details>
          </form>
        </FiltersToggle>

        <section aria-live="polite" className="mt-5">
          {!parsed ? <Empty title="Filtros inválidos" hint="Revise os valores e tente de novo." href="/jobs" cta="Limpar filtros" /> : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-abyss/70">{parsed.total} {parsed.total === 1 ? "vaga encontrada" : "vagas encontradas"}
                  {active > 0 && <> · <Link href="/jobs" className="text-tide hover:underline">limpar filtros</Link></>}</p>
                <ViewSwitcher />
              </div>
              {items.length === 0 ? <Empty title="Nenhuma vaga com esses filtros" hint="Tente remover algum filtro ou buscar por outra palavra." href="/jobs" cta="Limpar filtros" /> : (
                <Suspense>
                  <JobsBoard>
                    <div className="jobs-list">
                      {items.map((j) => <div key={j.id} data-job={j.id} data-selected={j.id === selectedId}>
                        <JobCard job={j} save={viewer.save(j.id)} score={viewer.score(j)} /></div>)}
                    </div>
                    <aside className="jobs-detail" aria-label="Vaga selecionada">
                      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-auto rounded-panel border border-mist/70 bg-casco/60 transition-opacity">
                        {detail ? <JobDetailPanel d={detail} /> : <p className="p-6 text-sm text-abyss/70">Escolha uma vaga para ver os detalhes.</p>}
                      </div>
                    </aside>
                  </JobsBoard>
                </Suspense>
              )}
              {parsed.pages > 1 && <div className="mt-6 flex items-center justify-between">
                {parsed.page > 1 ? <Link className="btn-ghost" href={`/jobs?${qs(parsed.page - 1)}`}>Anterior</Link> : <span />}
                <span className="text-sm">Página {parsed.page} de {parsed.pages}</span>
                {parsed.page < parsed.pages ? <Link className="btn-ghost" href={`/jobs?${qs(parsed.page + 1)}`}>Próxima</Link> : <span />}
              </div>}
            </>
          )}
        </section>
      </main>
    </>
  );
}
