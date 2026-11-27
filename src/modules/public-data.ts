import { db } from "@/lib/db";
import { cachedPublic } from "@/lib/cache";
import { jobCardCompany } from "@/lib/queries";
import { searchJobs } from "./jobs.service";
import { splitDemo } from "@/lib/display";

const publicJob = { status: "ACTIVE" as const, flagged: false, company: { user: { active: true } } };

/** Tudo o que a página inicial mostra igual para todo mundo. */
export const homePublic = cachedPublic(async () => {
  const [pool, contacts, openCount, applications, quick, areas, cities] = await Promise.all([
    db.job.findMany({ where: publicJob, orderBy: { publishedAt: "desc" }, take: 40,
      include: { company: jobCardCompany, skills: { include: { skill: true } } } }),
    db.companyProfile.findMany({ where: { user: { active: true }, jobs: { some: { status: "ACTIVE", flagged: false } } },
      select: { id: true, userId: true, name: true, industry: true, location: true, description: true,
        user: { select: { image: { select: { updatedAt: true } } } },
        jobs: { where: { status: "ACTIVE", flagged: false }, orderBy: { publishedAt: "desc" },
          select: { id: true, title: true, area: true, location: true, workMode: true, contractType: true, seniority: true, salaryMin: true, salaryMax: true, publishedAt: true } } } }),
    db.job.count({ where: publicJob }),
    db.jobApplication.count(),
    Promise.all([
      db.job.count({ where: { ...publicJob, contractType: "INTERNSHIP" } }),
      db.job.count({ where: { ...publicJob, workMode: "REMOTE" } }),
      db.job.count({ where: { ...publicJob, minYears: 0 } }),
      db.job.count({ where: { ...publicJob, seniority: "JUNIOR" } }),
      db.job.count({ where: { ...publicJob, forApprentice: true } }),
      db.job.count({ where: { ...publicJob, pcdOnly: true } }),
    ]),
    db.job.groupBy({ by: ["area"], where: publicJob, _count: { _all: true }, orderBy: { _count: { area: "desc" } }, take: 8 }),
    db.job.groupBy({ by: ["location"], where: publicJob, _count: { _all: true }, orderBy: { _count: { location: "desc" } }, take: 8 }),
  ]);
  return { pool, contacts, openCount, applications, quick, areas, cities };
}, "home");

/** Resultado de busca + contadores da página de vagas. */
export const jobsPublic = cachedPublic(async (filters: Record<string, string>) => {
  const [parsed, total, remote, internships, hiring, noExp] = await Promise.all([
    searchJobs(filters).catch(() => null),
    db.job.count({ where: publicJob }), db.job.count({ where: { ...publicJob, workMode: "REMOTE" } }),
    db.job.count({ where: { ...publicJob, contractType: "INTERNSHIP" } }),
    db.companyProfile.count({ where: { user: { active: true }, jobs: { some: { status: "ACTIVE", flagged: false } } } }),
    db.job.count({ where: { ...publicJob, minYears: 0 } }),
  ]);
  return { parsed, total, remote, internships, hiring, noExp };
}, "jobs");

export const companiesPublic = cachedPublic(() => db.companyProfile.findMany({ where: { user: { active: true } },
  orderBy: [{ jobs: { _count: "desc" } }, { name: "asc" }],
  include: { user: { select: { id: true, image: { select: { updatedAt: true } } } }, _count: { select: { jobs: { where: { status: "ACTIVE", flagged: false } } } } } }), "companies");

export const companyPublic = cachedPublic((id: string) => db.companyProfile.findUnique({ where: { id }, include: {
  user: { select: { id: true, active: true, image: { select: { updatedAt: true } } } },
  jobs: { where: { status: "ACTIVE", flagged: false }, orderBy: { publishedAt: "desc" }, include: { company: jobCardCompany, skills: { include: { skill: true } } } } } }), "company");

export const jobPublic = cachedPublic((id: string) => db.job.findUnique({ where: { id }, include: { company: true, skills: { include: { skill: true } } } }), "job");

/** Todas as vagas abertas no formato da análise de perfil (página inicial e /mercado). */
export const matchPool = cachedPublic(async () => {
  const rows = await db.job.findMany({ where: publicJob, orderBy: { publishedAt: "desc" }, take: 500,
    select: { id: true, title: true, area: true, location: true, workMode: true, contractType: true, minYears: true, salaryMin: true, salaryMax: true,
      company: { select: { name: true } }, skills: { select: { skill: { select: { name: true } } } } } });
  return rows.map((j) => {
    const { name: company, demo } = splitDemo(j.company.name);
    return { id: j.id, title: j.title, company, demo, area: j.area, location: j.location,
      workMode: j.workMode as string, contractType: j.contractType as string, minYears: j.minYears, salaryMin: j.salaryMin, salaryMax: j.salaryMax,
      skills: j.skills.map((s) => s.skill.name) };
  });
}, "match-pool");

/** Por área de vaga: quantas vagas abertas e as habilidades mais pedidas (para /mercado). */
export const areaStats = cachedPublic(async () => {
  const pool = await matchPool();
  const map = new Map<string, { count: number; skills: Map<string, number> }>();
  for (const j of pool) {
    const cur = map.get(j.area) ?? { count: 0, skills: new Map<string, number>() };
    cur.count++;
    for (const s of j.skills) cur.skills.set(s, (cur.skills.get(s) ?? 0) + 1);
    map.set(j.area, cur);
  }
  return [...map.entries()].map(([area, v]) => ({ area, count: v.count,
    topSkills: [...v.skills.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6).map(([name, n]) => ({ name, n })) }));
}, "area-stats");
