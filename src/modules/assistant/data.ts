// Consultas do assistente. Só leitura, sempre no escopo de quem está conversando:
// visitante vê o que é público; candidato vê também o próprio perfil e candidaturas;
// empresa vê também as próprias vagas e as candidaturas que recebeu.
// O que sai daqui vai para o modelo de IA, então cada função devolve o mínimo necessário.
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { splitDemo } from "@/lib/display";
import { appStatusLabel, contractLabel, jobStatusLabel, salaryRange, seniorityLabel, workModeLabel } from "@/lib/labels";
import { computeCompatibility, type CandidateInput } from "../compatibility";

export type Viewer = { id: string; role: "CANDIDATE" | "COMPANY" | "ADMIN" } | null;

const publicJob: Prisma.JobWhereInput = { status: "ACTIVE", flagged: false, company: { user: { active: true } } };
const jobInclude = { company: { select: { id: true, name: true } }, skills: { select: { skill: { select: { name: true } } } } } as const;
type JobRow = Prisma.JobGetPayload<{ include: typeof jobInclude }>;

const day = (d: Date) => d.toISOString().slice(0, 10);
const clip = (s: string | null | undefined, max: number) => (!s ? null : s.length > max ? `${s.slice(0, max).trimEnd()}…` : s);
const firstName = (name: string) => splitDemo(name).name.split(/\s+/)[0] ?? "";

/** Perfil do candidato no formato da compatibilidade (ou null se não for candidato). */
async function candidateOf(viewer: Viewer) {
  if (viewer?.role !== "CANDIDATE") return null;
  const p = await db.candidateProfile.findUnique({
    where: { userId: viewer.id },
    select: { id: true, headline: true, about: true, location: true, interestArea: true, workMode: true, yearsExperience: true,
      skills: { select: { skill: { select: { name: true } } } } },
  });
  if (!p) return null;
  const input: CandidateInput = { skills: p.skills.map((s) => s.skill.name), interestArea: p.interestArea, workMode: p.workMode,
    location: p.location, yearsExperience: p.yearsExperience };
  // sem habilidades nem área a nota não diz nada (mesma regra das listas de vagas)
  return { profile: p, input, scorable: input.skills.length > 0 || !!input.interestArea };
}

function scoreOf(c: CandidateInput, j: JobRow) {
  return computeCompatibility(c, { skills: j.skills.map((s) => s.skill.name), area: j.area, workMode: j.workMode, location: j.location, minYears: j.minYears });
}

function jobSummary(j: JobRow) {
  const company = splitDemo(j.company.name);
  return {
    id: j.id, titulo: j.title, empresa: company.name, demonstracao: company.demo || undefined,
    area: j.area, cidade: j.location, modalidade: workModeLabel[j.workMode], contrato: contractLabel[j.contractType],
    senioridade: seniorityLabel[j.seniority], salario: salaryRange(j.salaryMin, j.salaryMax) ?? undefined,
    experienciaMinima: j.minYears > 0 ? `${j.minYears} ano(s)` : "não exige", publicadaEm: day(j.publishedAt),
    link: `/jobs/${j.id}`,
  };
}

export type JobSearchInput = {
  termo?: string; area?: string; cidade?: string;
  modalidade?: "ONSITE" | "HYBRID" | "REMOTE"; contrato?: "CLT" | "PJ" | "INTERNSHIP" | "TEMPORARY";
  senioridade?: "INTERN" | "JUNIOR" | "MID" | "SENIOR" | "LEAD"; semExperiencia?: boolean; salarioMinimo?: number;
  publicadasNosUltimosDias?: number; ordenar?: "recentes" | "compatibilidade"; limite?: number;
};

/** Busca nas vagas ativas, com os mesmos critérios da página /jobs. */
export async function searchJobsFor(viewer: Viewer, f: JobSearchInput) {
  const where: Prisma.JobWhereInput = { ...publicJob };
  const and: Prisma.JobWhereInput[] = [];
  if (f.termo) {
    // cada palavra precisa aparecer em algum campo: "react remoto" acha vagas com as duas ideias
    for (const word of f.termo.split(/\s+/).filter((w) => w.length > 1).slice(0, 5)) {
      and.push({ OR: [
        { title: { contains: word, mode: "insensitive" } },
        { description: { contains: word, mode: "insensitive" } },
        { area: { contains: word, mode: "insensitive" } },
        { company: { name: { contains: word, mode: "insensitive" } } },
        { skills: { some: { skill: { name: { contains: word, mode: "insensitive" } } } } },
      ] });
    }
  }
  if (f.area) and.push({ area: { contains: f.area, mode: "insensitive" } });
  if (f.cidade) and.push({ location: { contains: f.cidade, mode: "insensitive" } });
  if (f.modalidade) where.workMode = f.modalidade;
  if (f.contrato) where.contractType = f.contrato;
  if (f.senioridade) where.seniority = f.senioridade;
  if (f.semExperiencia) where.minYears = 0;
  if (f.salarioMinimo) where.salaryMax = { gte: f.salarioMinimo };
  if (f.publicadasNosUltimosDias) where.publishedAt = { gte: new Date(Date.now() - f.publicadasNosUltimosDias * 86_400_000) };
  if (and.length) where.AND = and;

  const me = await candidateOf(viewer);
  const byScore = f.ordenar === "compatibilidade" && me?.scorable;
  const limit = Math.min(Math.max(f.limite ?? 6, 1), 8);
  const [rows, total] = await Promise.all([
    db.job.findMany({ where, orderBy: { publishedAt: "desc" }, take: byScore ? 60 : limit, include: jobInclude }),
    db.job.count({ where }),
  ]);
  const applied = me ? new Set((await db.jobApplication.findMany({ where: { candidateId: me.profile.id, jobId: { in: rows.map((r) => r.id) } },
    select: { jobId: true } })).map((a) => a.jobId)) : new Set<string>();

  let items = rows.map((j) => ({ j, score: me?.scorable ? scoreOf(me.input, j).score : undefined }));
  if (byScore) items = items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, limit);
  return {
    total,
    mostrando: items.length,
    ordenadoPor: byScore ? "compatibilidade" : "mais recentes",
    vagas: items.map(({ j, score }) => ({ ...jobSummary(j), compatibilidade: score, jaCandidatou: me ? applied.has(j.id) : undefined })),
    verTodas: `/jobs${f.termo ? `?q=${encodeURIComponent(f.termo)}` : ""}`,
    observacao: !viewer ? "Visitante: para ver a compatibilidade com cada vaga é preciso entrar como candidato."
      : viewer.role === "CANDIDATE" && !me?.scorable ? "O perfil ainda não tem habilidades nem área de interesse, então não há nota de compatibilidade." : undefined,
  };
}

/** Detalhes de uma vaga ativa (ou de uma vaga da própria empresa, em qualquer situação). */
export async function jobDetailsFor(viewer: Viewer, id: string) {
  const ownCompany = viewer?.role === "COMPANY" ? { company: { userId: viewer.id } } : null;
  const j = await db.job.findFirst({ where: { id, OR: [publicJob, ...(ownCompany ? [ownCompany] : [])] }, include: jobInclude });
  if (!j) return { erro: "Vaga não encontrada ou não está mais disponível." };
  const me = await candidateOf(viewer);
  const base = {
    ...jobSummary(j),
    situacao: jobStatusLabel[j.status],
    habilidades: j.skills.map((s) => s.skill.name),
    descricao: clip(j.description, 1500), responsabilidades: clip(j.responsibilities, 800),
    requisitos: clip(j.requirements, 800), beneficios: clip(j.benefits, 500),
    empresaLink: `/companies/${j.company.id}`,
  };
  if (!me) return base;
  const app = await db.jobApplication.findUnique({ where: { jobId_candidateId: { jobId: j.id, candidateId: me.profile.id } }, select: { status: true } });
  const saved = await db.savedJob.findFirst({ where: { jobId: j.id, candidateId: me.profile.id }, select: { jobId: true } });
  const c = me.scorable ? scoreOf(me.input, j) : null;
  return {
    ...base,
    compatibilidade: c ? { nota: c.score, criterios: c.criteria.map((k) => ({ criterio: k.label, peso: k.weight, atendido: `${Math.round(k.ratio * 100)}%`, detalhe: k.detail })),
      habilidadesQueFaltam: c.missingSkills } : undefined,
    minhaCandidatura: app ? appStatusLabel[app.status] : "ainda não se candidatou",
    salva: !!saved,
  };
}

/** Resumo do perfil de quem está logado, com o que falta preencher. */
export async function myProfileFor(viewer: Viewer) {
  if (!viewer) return { erro: "Visitante: é preciso entrar para ver um perfil.", link: "/login" };
  if (viewer.role === "CANDIDATE") {
    const me = await candidateOf(viewer);
    if (!me) return { erro: "Perfil de candidato não encontrado." };
    const p = me.profile;
    const checks: [string, boolean][] = [["título profissional", !!p.headline], ["sobre você", !!p.about], ["cidade", !!p.location],
      ["área de interesse", !!p.interestArea], ["modalidade preferida", !!p.workMode], ["habilidades", me.input.skills.length > 0]];
    const [apps, saved, educations, experiences] = await Promise.all([
      db.jobApplication.count({ where: { candidateId: p.id } }), db.savedJob.count({ where: { candidateId: p.id } }),
      db.education.count({ where: { candidateId: p.id } }), db.experience.count({ where: { candidateId: p.id } }),
    ]);
    return {
      tipo: "candidato",
      perfilPreenchido: `${Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100)}%`,
      faltaPreencher: checks.filter(([, ok]) => !ok).map(([k]) => k),
      titulo: p.headline, cidade: p.location, areaDeInteresse: p.interestArea,
      modalidadePreferida: p.workMode ? workModeLabel[p.workMode] : null, anosDeExperiencia: p.yearsExperience,
      habilidades: me.input.skills, formacoes: educations, experiencias: experiences,
      candidaturas: apps, vagasSalvas: saved,
      links: { editarPerfil: "/candidate/profile", curriculo: "/candidate/resume" },
    };
  }
  if (viewer.role === "COMPANY") {
    const c = await db.companyProfile.findUnique({ where: { userId: viewer.id },
      select: { id: true, name: true, description: true, industry: true, website: true, location: true } });
    if (!c) return { erro: "Perfil de empresa não encontrado." };
    const byStatus = await db.job.groupBy({ by: ["status"], where: { companyId: c.id }, _count: true });
    const checks: [string, boolean][] = [["descrição", !!c.description], ["setor", !!c.industry], ["site", !!c.website], ["cidade", !!c.location]];
    return {
      tipo: "empresa", nome: splitDemo(c.name).name, setor: c.industry, cidade: c.location, site: c.website,
      faltaPreencher: checks.filter(([, ok]) => !ok).map(([k]) => k),
      vagas: Object.fromEntries(byStatus.map((s) => [jobStatusLabel[s.status], s._count])),
      links: { editarPerfil: "/company/profile", paginaPublica: `/companies/${c.id}`, novaVaga: "/company/jobs/new" },
    };
  }
  return { tipo: "administrador", observacao: "Administradores não têm perfil de candidato nem de empresa.", link: "/admin/dashboard" };
}

/** Candidaturas do candidato logado. */
export async function myApplicationsFor(viewer: Viewer) {
  if (viewer?.role !== "CANDIDATE") return { erro: "Só candidatos têm candidaturas." };
  const rows = await db.jobApplication.findMany({
    where: { candidate: { userId: viewer.id } }, orderBy: { updatedAt: "desc" }, take: 20,
    select: { status: true, compatibility: true, createdAt: true, updatedAt: true,
      job: { select: { id: true, title: true, status: true, company: { select: { name: true } } } } },
  });
  const total = await db.jobApplication.count({ where: { candidate: { userId: viewer.id } } });
  return {
    total,
    candidaturas: rows.map((a) => ({
      vaga: a.job.title, empresa: splitDemo(a.job.company.name).name, situacao: appStatusLabel[a.status],
      compatibilidadeNoEnvio: a.compatibility ?? undefined, enviadaEm: day(a.createdAt), atualizadaEm: day(a.updatedAt),
      vagaAtiva: a.job.status === "ACTIVE", link: `/jobs/${a.job.id}`,
    })),
    link: "/candidate/applications",
  };
}

/** Vagas da empresa logada e as candidaturas que cada uma recebeu. */
export async function companyJobsFor(viewer: Viewer) {
  if (viewer?.role !== "COMPANY") return { erro: "Só empresas têm vagas publicadas." };
  const jobs = await db.job.findMany({
    where: { company: { userId: viewer.id } }, orderBy: { publishedAt: "desc" }, take: 15,
    select: { id: true, title: true, status: true, flagged: true, publishedAt: true,
      applications: { orderBy: [{ compatibility: "desc" }, { createdAt: "desc" }],
        select: { status: true, compatibility: true, createdAt: true, candidate: { select: { user: { select: { name: true } } } } } } },
  });
  return {
    vagas: jobs.map((j) => {
      const counts: Record<string, number> = {};
      for (const a of j.applications) counts[appStatusLabel[a.status]] = (counts[appStatusLabel[a.status]] ?? 0) + 1;
      const open = j.applications.filter((a) => a.status !== "WITHDRAWN" && a.status !== "REJECTED");
      return {
        id: j.id, titulo: j.title, situacao: jobStatusLabel[j.status], emAnalisePelaModeracao: j.flagged || undefined,
        publicadaEm: day(j.publishedAt), candidaturas: j.applications.length, porSituacao: counts,
        // só o primeiro nome: o suficiente para a empresa se orientar, sem levar dados pessoais ao modelo
        maisCompativeis: open.slice(0, 3).map((a) => ({ candidato: firstName(a.candidate.user.name),
          compatibilidade: a.compatibility ?? undefined, situacao: appStatusLabel[a.status], recebidaEm: day(a.createdAt) })),
        candidaturasLink: `/company/applications?job=${j.id}`, editarLink: `/company/jobs/${j.id}/edit`,
      };
    }),
    links: { todasAsCandidaturas: "/company/applications", minhasVagas: "/company/jobs", novaVaga: "/company/jobs/new" },
  };
}

/** Empresas com perfil público e quantas vagas ativas cada uma tem. */
export async function companiesFor(termo?: string) {
  const where: Prisma.CompanyProfileWhereInput = { user: { active: true },
    ...(termo ? { OR: [{ name: { contains: termo, mode: "insensitive" } }, { industry: { contains: termo, mode: "insensitive" } },
      { location: { contains: termo, mode: "insensitive" } }] } : {}) };
  const rows = await db.companyProfile.findMany({ where, take: 40,
    select: { id: true, name: true, industry: true, location: true, description: true, _count: { select: { jobs: { where: publicJob } } } } });
  // quem tem mais vagas abertas primeiro; empate pelo nome sem o prefixo [Demo]
  const sorted = rows.sort((a, b) => b._count.jobs - a._count.jobs || splitDemo(a.name).name.localeCompare(splitDemo(b.name).name, "pt-BR")).slice(0, 8);
  return {
    empresas: sorted.map((c) => ({ nome: splitDemo(c.name).name, demonstracao: splitDemo(c.name).demo || undefined, setor: c.industry, cidade: c.location,
      sobre: clip(c.description, 200), vagasAbertas: c._count.jobs, link: `/companies/${c.id}` })),
    link: "/companies",
  };
}

/* ---------- modos: revisão de currículo e ajuda para empresas ---------- */

const ym = (d: Date | null) => (d ? d.toISOString().slice(0, 7) : "atual");

/** Currículo completo do candidato logado, para a revisão. Sem e-mail, telefone ou CEP. */
export async function resumeFor(viewer: Viewer) {
  if (viewer?.role !== "CANDIDATE") return { erro: "A revisão de currículo é para candidatos logados.", link: "/login" };
  const p = await db.candidateProfile.findUnique({ where: { userId: viewer.id }, select: {
    headline: true, about: true, location: true, interestArea: true, workMode: true, yearsExperience: true,
    skills: { select: { verifiedAt: true, skill: { select: { name: true } } } },
    experiences: { orderBy: { startDate: "desc" }, select: { company: true, role: true, description: true, startDate: true, endDate: true } },
    educations: { orderBy: { startYear: "desc" }, select: { institution: true, course: true, startYear: true, endYear: true } },
    projects: { select: { title: true, description: true, url: true, school: true, validatedAt: true } },
  } });
  if (!p) return { erro: "Perfil de candidato não encontrado." };
  return {
    titulo: p.headline, sobre: p.about, cidade: p.location, areaDeInteresse: p.interestArea,
    modalidade: p.workMode ? workModeLabel[p.workMode] : null, anosDeExperiencia: p.yearsExperience,
    habilidades: p.skills.map((s) => (s.verifiedAt ? `${s.skill.name} (comprovada por prova)` : s.skill.name)),
    experiencias: p.experiences.map((e) => ({ cargo: e.role, empresa: e.company, periodo: `${ym(e.startDate)} a ${ym(e.endDate)}`, descricao: e.description })),
    formacao: p.educations.map((e) => ({ curso: e.course, instituicao: e.institution, periodo: `${e.startYear} a ${e.endYear ?? "atual"}` })),
    projetos: p.projects.map((x) => ({ titulo: x.title, descricao: x.description, link: x.url, escola: x.school, confirmadoPeloProfessor: !!x.validatedAt })),
    links: { editarPerfil: "/candidate/profile", curriculo: "/candidate/resume", provas: "/candidate/provas" },
  };
}

/**
 * Candidatos de uma vaga da empresa logada, para o resumo. Só o necessário para comparar:
 * primeiro nome, etapa, compatibilidade, habilidades, experiência e projetos. Sem contato.
 */
export async function applicantsFor(viewer: Viewer, jobId: string) {
  if (viewer?.role !== "COMPANY") return { erro: "O resumo de candidatos é para empresas logadas.", link: "/login" };
  const job = await db.job.findFirst({ where: { id: jobId, company: { userId: viewer.id } },
    select: { id: true, title: true, skills: { select: { skill: { select: { name: true } } } } } });
  if (!job) return { erro: "Vaga não encontrada entre as vagas da sua empresa. Use vagas_da_empresa para ver os ids." };
  const apps = await db.jobApplication.findMany({ where: { jobId, status: { not: "WITHDRAWN" } }, orderBy: { compatibility: "desc" }, take: 20,
    select: { id: true, status: true, compatibility: true, coverNote: true, createdAt: true, candidate: { select: { id: true, headline: true, location: true, yearsExperience: true,
      user: { select: { name: true } }, skills: { select: { verifiedAt: true, skill: { select: { name: true } } } },
      projects: { where: { validatedAt: { not: null } }, select: { title: true } }, experiences: { select: { role: true } } } } } });
  const wanted = job.skills.map((s) => s.skill.name.toLowerCase());
  return {
    vaga: { id: job.id, titulo: job.title, habilidadesPedidas: job.skills.map((s) => s.skill.name), link: `/company/applications?job=${job.id}` },
    total: apps.length,
    candidatos: apps.map((a) => {
      const skills = a.candidate.skills.map((s) => s.skill.name);
      return {
        nome: splitDemo(a.candidate.user.name).name.split(/\s+/)[0], etapa: appStatusLabel[a.status], compatibilidade: `${a.compatibility}%`,
        titulo: a.candidate.headline, cidade: a.candidate.location, anosDeExperiencia: a.candidate.yearsExperience,
        habilidadesDaVaga: skills.filter((s) => wanted.includes(s.toLowerCase())),
        habilidadesQueFaltam: job.skills.map((s) => s.skill.name).filter((s) => !skills.some((k) => k.toLowerCase() === s.toLowerCase())),
        comprovadas: a.candidate.skills.filter((s) => s.verifiedAt).map((s) => s.skill.name),
        projetosConfirmados: a.candidate.projects.map((p) => p.title), cargosAnteriores: a.candidate.experiences.map((e) => e.role),
        mensagem: a.coverNote?.slice(0, 300) ?? null, curriculo: `/company/candidates/${a.candidate.id}`,
      };
    }),
  };
}
