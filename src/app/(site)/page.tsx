import Link from "next/link";
import { db } from "@/lib/db";
import { splitDemo } from "@/lib/display";
import { Empty, JobCard } from "@/components/ui";
import { Sonar } from "@/components/Sonar";
import { jobViewer } from "@/modules/viewer";
import { homePublic, matchPool } from "@/modules/public-data";
import { type MatchForm } from "@/components/home/MatchSimulator";
import { InsightPanel, type Panorama } from "@/components/home/InsightPanel";
import { marketAreaOfJobArea } from "@/modules/market/areas";
import { contractLabel, workModeLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

const faqs = [
  ["A compatibilidade mostra se eu sou bom para a vaga?", "Não. Ela compara habilidades, área, modalidade, cidade e experiência com os requisitos da vaga, por regras que você pode ver. É um guia, não um julgamento, e a decisão é sempre de uma pessoa da empresa."],
  ["Preciso pagar para me candidatar?", "Não. Candidatos nunca pagam nada. Empresas que pedem pagamento de candidatos são removidas da plataforma."],
  ["Como sei em que etapa está minha candidatura?", "Em Candidaturas, com o histórico de cada mudança. Toda mudança também gera um aviso no site e, se você quiser, por e-mail."],
  ["O que a empresa vê de mim?", "Só a empresa da vaga em que você se candidatou vê seu perfil, foto e e-mail. Outras empresas não veem suas candidaturas."],
  ["Posso apagar meus dados?", "Sim. Em Configurações, Privacidade, você baixa uma cópia dos seus dados ou exclui a conta na hora."],
  ["Os dados da demonstração são reais?", "Não. Empresas e vagas com o selo Demo são fictícias e servem para mostrar como a plataforma funciona."],
];

const ACTIVE_APP = ["SUBMITTED", "IN_REVIEW", "IN_PROCESS", "INTERVIEW"] as const;
const plural = (n: number, one: string, many: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;

export default async function Home(props: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await props.searchParams;
  const [{ pool, contacts, openCount, applications, quick, areas, cities }, viewer, allJobs] = await Promise.all([homePublic(), jobViewer(), matchPool()]);
  const prefill = viewer.user?.role === "CANDIDATE" ? await profilePrefill(viewer.user.id) : null;
  const skillOptions = [...new Set(allJobs.flatMap((j) => j.skills))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const areaOptions = [...new Set(allJobs.map((j) => j.area))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const cityOptions = [...new Set(allJobs.map((j) => j.location))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const panorama = buildPanorama(allJobs);
  const live: Record<string, number> = {};
  for (const j of allJobs) { const m = marketAreaOfJobArea(j.area); if (m) live[m.id] = (live[m.id] ?? 0) + 1; }

  const personal = viewer.user ? await personalData(viewer.user) : null;
  const recommended = viewer.user?.role === "CANDIDATE"
    ? pool.filter((j) => !personal?.appliedIds.has(j.id)).map((j) => ({ j, score: viewer.score(j) ?? 0 })).sort((a, b) => b.score - a.score).slice(0, 3)
    : [];
  const shown = new Set(recommended.map((r) => r.j.id));

  // vagas recentes variadas: no máximo duas por empresa, sem repetir as recomendadas
  const perCompany = new Map<string, number>();
  const recent = pool.filter((j) => !shown.has(j.id)).filter((j) => {
    const n = perCompany.get(j.companyId) ?? 0;
    if (n >= 2) return false;
    perCompany.set(j.companyId, n + 1);
    return true;
  }).slice(0, 6);
  const radar = contacts
    .sort((a, b) => b.jobs[0].publishedAt.getTime() - a.jobs[0].publishedAt.getTime()).slice(0, 12)
    .map(({ user, jobs: js, ...c }) => ({ ...c, imageVersion: user.image ? user.image.updatedAt.getTime() : null, jobs: js.map(({ publishedAt: _p, ...j }) => j) }));

  // sugestões da busca: cargos, habilidades e empresas que existem de verdade
  const suggestions = [...new Set([
    ...pool.map((j) => j.title),
    ...pool.flatMap((j) => j.skills.map((s) => s.skill.name)),
    ...contacts.map((c) => splitDemo(c.name).name),
  ])].slice(0, 60);
  const [internships, remote, noExp, junior, apprentice, pcd] = quick;
  const shortcuts: [string, string, number][] = [
    ["Estágio", "contractType=INTERNSHIP", internships], ["Jovem Aprendiz", "aprendiz=1", apprentice], ["Sem experiência", "noExp=1", noExp],
    ["Remoto", "workMode=REMOTE", remote], ["Júnior", "seniority=JUNIOR", junior], ["Vagas PcD", "pcd=1", pcd],
  ];

  return (
    <>
      {aviso === "conta-excluida" && (
        <p role="status" className="border-b border-reef/30 bg-reef/10 px-4 py-3 text-center text-sm text-reef">Sua conta e seus dados foram excluídos. Obrigado por ter usado o Nautiwork.</p>
      )}
      <main>
        <section className="relative overflow-hidden border-b border-mist/60">
          {/* linhas de profundidade do fundo do mar, bem discretas */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true"
            style={{ maskImage: "linear-gradient(to bottom, black 30%, transparent)" }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <path key={i} d={`M0 ${90 + i * 46} C 220 ${40 + i * 46}, 420 ${170 + i * 46}, 640 ${100 + i * 46} S 1020 ${30 + i * 46}, 1200 ${110 + i * 46}`}
                fill="none" stroke="rgb(var(--c-tide))" strokeOpacity={0.07 - i * 0.004} strokeWidth="1" />
            ))}
          </svg>
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:pb-20 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-8">
            {/* alinhado ao topo: abrir o painel do radar não empurra o texto */}
            <div className="lg:pt-10">
              {personal ? (
                <>
                  <h1 className="max-w-[16ch] text-[40px] font-semibold leading-[1.05] sm:text-6xl lg:text-[60px]">Olá, {personal.firstName}.</h1>
                  <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-abyss/80">{personal.summary}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {personal.actions.map(([label, href], i) => <Link key={href} href={href} className={i === 0 ? "btn-primary" : "btn-ghost"}>{label}</Link>)}
                  </div>
                </>
              ) : (
                <>
                  <h1 className="max-w-[14ch] text-[40px] font-semibold leading-[1.05] sm:text-6xl lg:text-[64px]">Ache a vaga que combina com o seu rumo.</h1>
                  <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-abyss/80">Monte seu perfil, veja o quanto cada vaga se aproxima das suas habilidades e acompanhe cada etapa da candidatura.</p>
                </>
              )}

              <form action="/jobs" className="mt-8 grid max-w-xl gap-2 rounded-panel border border-line bg-casco/80 p-2 backdrop-blur focus-within:border-tide sm:grid-cols-[1.3fr_1fr_auto]" role="search">
                <label className="sr-only" htmlFor="q">Cargo, empresa ou habilidade</label>
                <input id="q" name="q" list="home-q" autoComplete="off" placeholder="Cargo, empresa ou habilidade" className="input rounded-none border-transparent border-b-mist bg-transparent hover:border-transparent hover:border-b-mist sm:border-b-transparent sm:hover:border-b-transparent" />
                <datalist id="home-q">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
                <label className="sr-only" htmlFor="location">Cidade</label>
                <input id="location" name="location" list="home-city" autoComplete="off" placeholder="Cidade" className="input border-transparent bg-transparent hover:border-transparent sm:border-l-mist sm:rounded-none" />
                <datalist id="home-city">{cities.map((c) => <option key={c.location} value={c.location} />)}</datalist>
                <button className="btn-primary">Buscar vagas</button>
              </form>
              <nav aria-label="Buscas rápidas" className="mt-4 flex flex-wrap items-center gap-2">
                {shortcuts.filter(([, , n]) => n > 0).map(([label, qs, n]) => (
                  <Link key={label} href={`/jobs?${qs}`} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-mist bg-casco/50 px-4 text-sm text-abyss/80 transition-colors hover:border-tide/50 hover:text-abyss">
                    {label}<span className="tabular text-abyss/60">{n}</span>
                  </Link>
                ))}
              </nav>

              <dl className="mt-9 grid max-w-xl grid-cols-3 gap-4 border-t border-mist/70 pt-6">
                {([["vagas abertas", openCount], ["empresas contratando", contacts.length], ["candidaturas enviadas", applications]] as const).map(([label, n]) => (
                  <div key={label}>
                    <dt className="sr-only">{label}</dt>
                    <dd><span className="tabular block font-display text-3xl font-semibold text-abyss sm:text-4xl">{n.toLocaleString("pt-BR")}</span><span className="mt-1 block text-sm text-abyss/65">{label}</span></dd>
                  </div>
                ))}
              </dl>

              {!personal && (
                <p className="mt-6 text-sm text-abyss/70">
                  É empresa? <Link href="/register?tipo=empresa" className="font-semibold text-tide hover:text-deep hover:underline">Publique vagas sem custo</Link> e receba candidaturas organizadas por etapa.
                </p>
              )}
            </div>
            <Sonar companies={radar} />
          </div>
        </section>

        {recommended.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 pt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div><h2 className="text-2xl font-semibold sm:text-[28px]">Recomendadas para você</h2><p className="mt-1 text-sm text-abyss/65">Ordenadas pela compatibilidade com o seu perfil.</p></div>
              <Link href="/candidate/dashboard" className="tap shrink-0 text-sm font-semibold text-tide hover:text-deep hover:underline">Ver no painel</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{recommended.map(({ j, score }) => <JobCard key={j.id} job={j} score={score} save={viewer.save(j.id)} commute={viewer.commute(j)} />)}</div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 pt-16">
          <div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-2xl font-semibold sm:text-[28px]">Vagas recentes</h2><Link href="/jobs" className="tap shrink-0 text-sm font-semibold text-tide hover:text-deep hover:underline">Ver todas as vagas</Link></div>
          {recent.length === 0 ? <Empty title="Ainda não há vagas publicadas" hint="Quando uma empresa publicar, ela aparece aqui." href="/register?tipo=empresa" cta="Criar conta de empresa" />
            : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{recent.map((j) => <JobCard key={j.id} job={j} save={viewer.save(j.id)} score={viewer.score(j)} commute={viewer.commute(j)} />)}</div>}
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="como-funciona">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14 [&>*]:min-w-0">
            {/* fixa ao rolar: com o resultado da análise, a coluna da direita fica bem mais alta */}
            <div className="lg:sticky lg:top-24">
              <h2 id="como-funciona" className="text-2xl font-semibold sm:text-[28px]">Saiba o quanto combina antes de se candidatar</h2>
              <p className="mt-3 max-w-[52ch] leading-relaxed text-abyss/75">A compatibilidade segue regras abertas: habilidades valem metade, e área, modalidade, cidade e experiência completam a conta. Ao lado, digite seu perfil e veja na hora as vagas e a área que mais combinam, sem precisar de conta. Pelos ícones você também vê o panorama real das vagas abertas e o mercado em 20 áreas.</p>
              <ol className="mt-8 space-y-6">
                {[["Monte o perfil", "Habilidades, área de interesse, modalidade e cidade. Leva poucos minutos e vale para todas as candidaturas."],
                  ["Compare e candidate-se", "Cada vaga mostra a porcentagem, os critérios que pesaram e as habilidades que faltam."],
                  ["Acompanhe cada etapa", "Toda mudança de status fica no histórico e gera um aviso. Sem precisar perguntar à empresa."]].map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="tabular flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-tide/50 font-display text-sm font-semibold text-tide">{i + 1}</span>
                    <div><h3 className="font-semibold">{t}</h3><p className="mt-1 max-w-[46ch] text-sm leading-relaxed text-abyss/75">{d}</p></div>
                  </li>
                ))}
              </ol>
              <Link href="/mercado" className="card mt-8 flex items-center justify-between gap-4 transition-colors hover:border-tide/60">
                <span><span className="block font-semibold">O que o mercado pede em 2026</span><span className="mt-0.5 block text-sm text-abyss/70">Habilidades, cargos em alta e tendências em 20 áreas, com as fontes.</span></span>
                <span aria-hidden="true" className="text-xl text-tide">›</span>
              </Link>
            </div>
            <InsightPanel panorama={panorama} live={live} skillOptions={skillOptions} areaOptions={areaOptions} cityOptions={cityOptions} prefill={prefill} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="diferente">
          <div className="max-w-[62ch]">
            <h2 id="diferente" className="text-2xl font-semibold sm:text-[28px]">Feito para quem ainda não tem experiência</h2>
            <p className="mt-3 leading-relaxed text-abyss/75">Regras que a maioria dos sites de vaga não tem. Valem para todas as empresas que publicam aqui.</p>
          </div>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-panel border border-mist bg-mist sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["Vaga que pede dinheiro não entra", "Pix, taxa, curso pago ou dados bancários barram a publicação. Texto suspeito passa pela moderação, e três denúncias tiram a vaga do ar.", "/primeiro-emprego#golpes", "Como reconhecer golpe"],
              ["Mostre o que sabe sem experiência", "Provas curtas de habilidade dão o selo comprovada no currículo. O projeto do curso entra confirmado pelo professor.", "/register", "Criar perfil"],
              ["Recusa com retorno", "Quem recusa escolhe o motivo e as habilidades que faltaram. Você recebe cursos gratuitos para cada uma.", "/about#regras", "Ver todas as regras"],
              ["Salário sempre visível", "Toda vaga mostra a faixa salarial. Estágio e Jovem Aprendiz não podem pedir anos de experiência.", "/jobs?noExp=1", "Vagas sem experiência"],
              ["Quanto tempo até a vaga", "Com o seu CEP, cada vaga mostra o tempo estimado de casa até lá, e a busca filtra por minutos.", "/jobs", "Buscar vagas"],
              ["Guia do primeiro emprego", "Documentos, direitos do aprendiz e do estagiário e uma lista para marcar o que já fez.", "/primeiro-emprego", "Abrir o guia"],
            ] as const).map(([t, d, href, cta]) => (
              <li key={t} className="flex flex-col bg-casco p-6">
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-abyss/75">{d}</p>
                <Link href={href} className="tap mt-3 self-start text-sm font-semibold text-tide hover:text-deep hover:underline">{cta}</Link>
              </li>
            ))}
          </ul>
        </section>

        {(areas.length > 0 || cities.length > 0) && (
          <section className="mx-auto max-w-6xl px-4 pt-20" aria-labelledby="explorar">
            <div className="mb-6 flex items-end justify-between gap-4"><h2 id="explorar" className="text-2xl font-semibold sm:text-[28px]">Explorar vagas</h2><Link href="/companies" className="tap shrink-0 text-sm font-semibold text-tide hover:text-deep hover:underline">Ver empresas</Link></div>
            <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <h3 className="text-sm font-medium text-abyss/70">Por área</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">{areas.map((a) => (
                  <li key={a.area}><Link href={`/jobs?area=${encodeURIComponent(a.area)}`} className="card flex min-h-[56px] items-center justify-between gap-3 py-3 transition-colors hover:border-tide/60">
                    <span className="font-medium">{a.area}</span><span className="tabular text-sm text-abyss/60">{plural(a._count._all, "vaga", "vagas")}</span></Link></li>))}</ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-abyss/70">Por cidade</h3>
                <ul className="mt-3 grid gap-2">{cities.slice(0, 6).map((c) => (
                  <li key={c.location}><Link href={`/jobs?location=${encodeURIComponent(c.location)}`} className="card flex min-h-[56px] items-center justify-between gap-3 py-3 transition-colors hover:border-tide/60">
                    <span className="font-medium">{c.location}</span><span className="tabular text-sm text-abyss/60">{plural(c._count._all, "vaga", "vagas")}</span></Link></li>))}</ul>
              </div>
            </div>
          </section>
        )}

        {!personal && (
          <section className="mx-auto mt-20 max-w-6xl px-4">
            <div className="grid gap-px overflow-hidden rounded-panel border border-mist bg-mist md:grid-cols-2">
              <div className="bg-casco p-7 sm:p-9">
                <h2 className="text-xl font-semibold">Para quem busca vaga</h2>
                <p className="mt-3 max-w-[46ch] leading-relaxed text-abyss/80">Um perfil só para todas as candidaturas, vagas salvas e o status de cada processo num lugar.</p>
                <Link href="/register" className="btn-primary mt-6">Criar perfil grátis</Link>
              </div>
              <div className="bg-casco p-7 sm:p-9">
                <h2 className="text-xl font-semibold">Para empresas</h2>
                <p className="mt-3 max-w-[46ch] leading-relaxed text-abyss/80">Publique vagas, receba candidaturas ordenadas por compatibilidade e mova cada pessoa pelas etapas.</p>
                <Link href="/register?tipo=empresa" className="btn-primary mt-6">Publicar vaga</Link>
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 pb-6 pt-20" aria-labelledby="faq">
          <h2 id="faq" className="mb-6 text-2xl font-semibold sm:text-[28px]">Perguntas frequentes</h2>
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
            <div className="divide-y divide-mist overflow-hidden rounded-panel border border-mist bg-casco">{faqs.map(([q, a]) => (
              <details key={q} className="group">
                <summary className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 px-5 font-medium hover:bg-foam/50">
                  {q}
                  <svg className="shrink-0 text-tide transition-transform group-open:rotate-45" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </summary>
                <p className="max-w-[62ch] px-5 pb-5 leading-relaxed text-abyss/80">{a}</p>
              </details>))}</div>
            <aside className="card">
              <h3 className="font-semibold">Não achou sua resposta?</h3>
              <p className="mt-2 text-sm leading-relaxed text-abyss/75">Abra um pedido de suporte. A resposta chega no site e no seu e-mail, e o histórico fica guardado.</p>
              <Link href={viewer.user ? "/support/new" : "/login"} className="btn-ghost mt-4 w-full">{viewer.user ? "Falar com o suporte" : "Entrar para falar com o suporte"}</Link>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

/** Panorama real das vagas abertas (aba "Panorama das vagas"). */
function buildPanorama(jobs: { workMode: string; contractType: string; skills: string[]; minYears: number; salaryMin: number | null; salaryMax: number | null }[]): Panorama {
  const count = (keys: string[]) => { const m = new Map<string, number>(); for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  return {
    total: jobs.length,
    modes: count(jobs.map((j) => workModeLabel[j.workMode as keyof typeof workModeLabel] ?? j.workMode)).map(([label, n]) => ({ label, n })),
    contracts: count(jobs.map((j) => contractLabel[j.contractType as keyof typeof contractLabel] ?? j.contractType)).map(([label, n]) => ({ label, n })),
    skills: count(jobs.flatMap((j) => j.skills)).slice(0, 6).map(([name, n]) => ({ name, n })),
    noExperience: jobs.filter((j) => j.minYears === 0).length,
    withSalary: jobs.filter((j) => j.salaryMin !== null || j.salaryMax !== null).length,
  };
}

/** Dados do perfil do candidato para o botão "Usar meu perfil" do simulador. */
async function profilePrefill(userId: string): Promise<MatchForm | null> {
  const p = await db.candidateProfile.findUnique({ where: { userId }, select: { interestArea: true, workMode: true, location: true, yearsExperience: true,
    skills: { select: { skill: { select: { name: true } } } } } });
  if (!p) return null;
  return { skills: p.skills.map((s) => s.skill.name), interestArea: p.interestArea ?? "", workMode: p.workMode ?? "", location: p.location ?? "", yearsExperience: p.yearsExperience };
}

/** Saudação e atalhos da página inicial para quem está logado, conforme o papel. */
async function personalData(user: { id: string; name: string; role: "CANDIDATE" | "COMPANY" | "ADMIN" }) {
  const firstName = splitDemo(user.name).name.split(" ")[0] || "de volta";
  const week = new Date(Date.now() - 7 * 86_400_000);
  if (user.role === "CANDIDATE") {
    const apps = await db.jobApplication.findMany({ where: { candidate: { userId: user.id } }, select: { jobId: true, status: true } });
    const active = apps.filter((a) => (ACTIVE_APP as readonly string[]).includes(a.status)).length;
    return {
      firstName, appliedIds: new Set(apps.map((a) => a.jobId)),
      summary: active > 0 ? `Você tem ${plural(active, "candidatura em andamento", "candidaturas em andamento")}. Veja abaixo as vagas que mais combinam com o seu perfil.`
        : "Você não tem candidaturas em andamento. As vagas abaixo estão ordenadas pelo quanto combinam com o seu perfil.",
      actions: [["Minhas candidaturas", "/candidate/applications"], ["Editar perfil", "/candidate/profile"]] as [string, string][],
    };
  }
  if (user.role === "COMPANY") {
    const company = await db.companyProfile.findUnique({ where: { userId: user.id }, select: { id: true,
      _count: { select: { jobs: { where: { status: "ACTIVE" } } } } } });
    const fresh = company ? await db.jobApplication.count({ where: { job: { companyId: company.id }, createdAt: { gte: week } } }) : 0;
    return {
      firstName, appliedIds: new Set<string>(),
      summary: `${plural(fresh, "candidatura nova", "candidaturas novas")} nos últimos 7 dias, em ${plural(company?._count.jobs ?? 0, "vaga aberta", "vagas abertas")}.`,
      actions: [["Ver candidaturas", "/company/applications"], ["Publicar vaga", "/company/jobs/new"]] as [string, string][],
    };
  }
  const [tickets, flagged] = await Promise.all([db.supportTicket.count({ where: { status: "OPEN" } }), db.job.count({ where: { flagged: true } })]);
  return {
    firstName, appliedIds: new Set<string>(),
    summary: `${plural(tickets, "pedido de suporte aberto", "pedidos de suporte abertos")} e ${plural(flagged, "vaga sinalizada", "vagas sinalizadas")} para revisar.`,
    actions: [["Painel do admin", "/admin/dashboard"], ["Fila de suporte", "/admin/support"]] as [string, string][],
  };
}
