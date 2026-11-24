import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Empty, JobCard } from "@/components/ui";
import { searchJobs } from "@/modules/jobs.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vagas — Nautiwork" };

export default async function Jobs(props: { searchParams: Promise<Record<string, string>> }) {
  const searchParams = await props.searchParams;
  const clean = Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v));
  const parsed = await searchJobs(clean).catch(() => null);
  const qs = (page: number) => new URLSearchParams({ ...clean, page: String(page) }).toString();
  return (
    <>
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[260px_1fr]">
        <form className="card h-fit space-y-3" role="search" aria-label="Filtros">
          <h1 className="text-lg font-bold">Buscar vagas</h1>
          <div><label className="label" htmlFor="q">Palavra-chave</label><input id="q" name="q" defaultValue={clean.q} className="input" placeholder="Cargo, empresa, habilidade" /></div>
          <div><label className="label" htmlFor="area">Área</label><input id="area" name="area" defaultValue={clean.area} className="input" /></div>
          <div><label className="label" htmlFor="location">Cidade</label><input id="location" name="location" defaultValue={clean.location} className="input" /></div>
          <div><label className="label" htmlFor="workMode">Modalidade</label><select id="workMode" name="workMode" defaultValue={clean.workMode ?? ""} className="input"><option value="">Todas</option><option value="REMOTE">Remoto</option><option value="HYBRID">Híbrido</option><option value="ONSITE">Presencial</option></select></div>
          <div><label className="label" htmlFor="contractType">Contratação</label><select id="contractType" name="contractType" defaultValue={clean.contractType ?? ""} className="input"><option value="">Todas</option><option value="CLT">CLT</option><option value="PJ">PJ</option><option value="INTERNSHIP">Estágio</option><option value="TEMPORARY">Temporário</option></select></div>
          <div><label className="label" htmlFor="minSalary">Salário a partir de (R$)</label><input id="minSalary" name="minSalary" type="number" min={1} defaultValue={clean.minSalary} className="input" /></div>
          <div><label className="label" htmlFor="days">Publicada nos últimos</label><select id="days" name="days" defaultValue={clean.days ?? ""} className="input"><option value="">Qualquer data</option><option value="1">1 dia</option><option value="7">7 dias</option><option value="30">30 dias</option></select></div>
          <button className="btn-primary w-full">Aplicar filtros</button>
          <Link href="/jobs" className="block text-center text-sm text-tide">Limpar</Link>
        </form>
        <section aria-live="polite">
          {!parsed ? <Empty title="Filtros inválidos" hint="Revise os valores e tente de novo." href="/jobs" cta="Limpar filtros" /> : (
            <>
              <p className="mb-4 text-sm text-abyss/70">{parsed.total} {parsed.total === 1 ? "vaga encontrada" : "vagas encontradas"}</p>
              {parsed.items.length === 0 ? <Empty title="Nenhuma vaga com esses filtros" hint="Tente remover algum filtro ou buscar por outra palavra." href="/jobs" cta="Limpar filtros" /> :
                <div className="grid gap-4">{parsed.items.map((j) => <JobCard key={j.id} job={j} />)}</div>}
              {parsed.pages > 1 && <div className="mt-6 flex items-center justify-between">
                {parsed.page > 1 ? <Link className="btn-ghost" href={`/jobs?${qs(parsed.page - 1)}`}>Anterior</Link> : <span />}
                <span className="text-sm">Página {parsed.page} de {parsed.pages}</span>
                {parsed.page < parsed.pages ? <Link className="btn-ghost" href={`/jobs?${qs(parsed.page + 1)}`}>Próxima</Link> : <span />}
              </div>}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
