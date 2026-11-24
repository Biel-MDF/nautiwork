import Link from "next/link";
import { db } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Empty, JobCard } from "@/components/ui";
import { Sonar } from "@/components/Sonar";

export const dynamic = "force-dynamic";

const faqs = [
  ["A compatibilidade mostra se eu sou bom para a vaga?", "Não. Ela compara habilidades, área, modalidade, cidade e experiência com os requisitos da vaga, por regras que você pode ver. É um guia, não um julgamento."],
  ["Preciso pagar para me candidatar?", "Este é um projeto acadêmico e não cobra de ninguém."],
  ["Como sei em que etapa está minha candidatura?", "O status aparece em Candidaturas, com o histórico de cada mudança."],
  ["Os dados da demonstração são reais?", "Não. Empresas, vagas e pessoas do ambiente de demonstração são fictícias."],
];

export default async function Home() {
  const publicJob = { status: "ACTIVE" as const, flagged: false, company: { user: { active: true } } };
  const [jobs, companies, contacts, openCount] = await Promise.all([
    db.job.findMany({ where: publicJob, orderBy: { publishedAt: "desc" }, take: 6,
      include: { company: { select: { id: true, name: true } }, skills: { include: { skill: true } } } }),
    db.companyProfile.findMany({ where: { user: { active: true } }, take: 6, orderBy: [{ jobs: { _count: "desc" } }, { name: "asc" }],
      include: { _count: { select: { jobs: { where: { status: "ACTIVE", flagged: false } } } } } }),
    db.job.findMany({ where: publicJob, orderBy: { publishedAt: "desc" }, take: 12,
      select: { id: true, title: true, publishedAt: true, company: { select: { name: true } } } }),
    db.job.count({ where: publicJob }),
  ]);
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-mist/60">
          {/* linhas de profundidade do fundo do mar, bem discretas */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true"
            style={{ maskImage: "linear-gradient(to bottom, black 30%, transparent)" }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <path key={i} d={`M0 ${90 + i * 46} C 220 ${40 + i * 46}, 420 ${170 + i * 46}, 640 ${100 + i * 46} S 1020 ${30 + i * 46}, 1200 ${110 + i * 46}`}
                fill="none" stroke="#5CB8FF" strokeOpacity={0.07 - i * 0.004} strokeWidth="1" />
            ))}
          </svg>
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
            <div>
              <h1 className="max-w-[14ch] text-[40px] font-semibold leading-[1.05] sm:text-6xl lg:text-[64px]">Ache a vaga que combina com o seu rumo.</h1>
              <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-abyss/80">Monte seu perfil, veja o quanto cada vaga se aproxima das suas habilidades e acompanhe cada etapa da candidatura.</p>
              <form action="/jobs" className="mt-8 grid max-w-xl gap-2 rounded-panel border border-[#4269A1] bg-casco/80 p-2 backdrop-blur focus-within:border-tide sm:grid-cols-[1.3fr_1fr_auto]" role="search">
                <label className="sr-only" htmlFor="q">Cargo, empresa ou habilidade</label>
                <input id="q" name="q" placeholder="Cargo, empresa ou habilidade" className="input rounded-none border-transparent border-b-mist bg-transparent hover:border-transparent hover:border-b-mist sm:border-b-transparent sm:hover:border-b-transparent" />
                <label className="sr-only" htmlFor="location">Cidade</label>
                <input id="location" name="location" placeholder="Cidade" className="input border-transparent bg-transparent hover:border-transparent sm:border-l-mist sm:rounded-none" />
                <button className="btn-primary">Buscar vagas</button>
              </form>
              <p className="mt-4 text-sm text-abyss/60">Sem cadastro para buscar. Para se candidatar, crie um perfil grátis.</p>
            </div>
            <Sonar total={openCount} contacts={contacts.map((c) => ({ id: c.id, title: c.title, company: c.company.name, publishedAt: c.publishedAt }))} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-16">
          <div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-2xl font-semibold sm:text-[28px]">Vagas recentes</h2><Link href="/jobs" className="text-sm font-semibold text-tide hover:text-deep hover:underline">Ver todas as vagas</Link></div>
          {jobs.length === 0 ? <Empty title="Ainda não há vagas publicadas" hint="Quando uma empresa publicar, ela aparece aqui." href="/register" cta="Criar conta de empresa" />
            : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{jobs.map((j) => <JobCard key={j.id} job={j} />)}</div>}
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="grid gap-px overflow-hidden rounded-panel border border-mist bg-mist md:grid-cols-2">
            <div className="bg-casco p-7 sm:p-9">
              <h2 className="text-xl font-semibold">Para quem busca vaga</h2>
              <p className="mt-3 max-w-[48ch] leading-relaxed text-abyss/80">Um perfil só, usado em todas as candidaturas. Salve vagas, veja o que falta para cada uma e acompanhe o status sem precisar perguntar.</p>
              <Link href="/register" className="btn-primary mt-6">Criar perfil</Link>
            </div>
            <div className="bg-casco p-7 sm:p-9">
              <h2 className="text-xl font-semibold">Para empresas</h2>
              <p className="mt-3 max-w-[48ch] leading-relaxed text-abyss/80">Publique vagas, receba candidaturas organizadas por etapa e veja habilidades, formação e experiência de cada pessoa.</p>
              <Link href="/register" className="btn-ghost mt-6">Publicar vaga</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-20">
          <h2 className="mb-8 text-2xl font-semibold sm:text-[28px]">Como funciona</h2>
          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            {/* linha de rumo ligando as etapas */}
            <span className="absolute left-5 right-5 top-5 hidden h-px bg-gradient-to-r from-tide/60 via-mist to-mist md:block" aria-hidden="true" />
            {[["Monte o perfil", "Informe habilidades, área e modalidade preferida. É o que alimenta a compatibilidade."],
              ["Encontre e candidate-se", "Filtre vagas e veja a compatibilidade calculada por regras que você pode conferir."],
              ["Acompanhe", "Cada mudança de status fica registrada no histórico e gera uma notificação."]].map(([t, d], i) => (
              <li key={t} className="relative">
                <span className="tabular relative flex h-10 w-10 items-center justify-center rounded-full border border-tide/50 bg-fossa font-display text-sm font-semibold text-tide">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-1.5 max-w-[36ch] text-sm leading-relaxed text-abyss/75">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-20">
          <div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-2xl font-semibold sm:text-[28px]">Empresas</h2><Link href="/companies" className="text-sm font-semibold text-tide hover:text-deep hover:underline">Ver todas as empresas</Link></div>
          {companies.length === 0 ? <Empty title="Nenhuma empresa cadastrada" hint="As empresas aparecem aqui depois do cadastro." /> :
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{companies.map((c) => (
              <Link key={c.id} href={`/companies/${c.id}`} className="card flex items-center justify-between gap-4 transition-colors hover:border-tide/60">
                <span className="min-w-0"><span className="block truncate font-semibold">{c.name}</span><span className="block text-sm text-abyss/70">{c.industry ?? "Área não informada"}</span></span>
                <span className="tabular shrink-0 text-sm text-abyss/70"><span className="font-semibold text-abyss">{c._count.jobs}</span> {c._count.jobs === 1 ? "vaga" : "vagas"}</span>
              </Link>))}</div>}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-6 pt-20">
          <h2 className="mb-6 text-2xl font-semibold sm:text-[28px]">Perguntas frequentes</h2>
          <div className="max-w-3xl divide-y divide-mist overflow-hidden rounded-panel border border-mist bg-casco">{faqs.map(([q, a]) => (
            <details key={q} className="group">
              <summary className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 px-5 font-medium hover:bg-foam/50">
                {q}
                <svg className="shrink-0 text-tide transition-transform group-open:rotate-45" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </summary>
              <p className="max-w-[62ch] px-5 pb-5 leading-relaxed text-abyss/80">{a}</p>
            </details>))}</div>
        </section>
      </main>
      <Footer />
    </>
  );
}
