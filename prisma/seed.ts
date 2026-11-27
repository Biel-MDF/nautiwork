// Dados de DEMONSTRAÇÃO (fictícios). Uso: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
// Local: senha padrão documentada no README. Em servidor público, defina SEED_PASSWORD e
// SEED_ADMIN_PASSWORD; sem elas o seed se recusa a rodar, para não criar contas com senha conhecida.
const PUBLIC = !!process.env.VERCEL || process.env.NODE_ENV === "production";
const PASSWORD = process.env.SEED_PASSWORD || (PUBLIC ? "" : "Demo@12345");
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || (PUBLIC ? "" : PASSWORD);
if (!PASSWORD || !ADMIN_PASSWORD) throw new Error("Defina SEED_PASSWORD e SEED_ADMIN_PASSWORD para rodar o seed fora do ambiente local.");
const D = "@demo.nautiwork.test";

// centro aproximado de cada cidade das vagas demo, para a estimativa de deslocamento funcionar
const CITY: Record<string, { lat: number; lng: number }> = {
  "São Paulo": { lat: -23.5505, lng: -46.6333 }, Recife: { lat: -8.0476, lng: -34.877 }, Santos: { lat: -23.9608, lng: -46.3336 },
  "Belo Horizonte": { lat: -19.9167, lng: -43.9345 }, Curitiba: { lat: -25.4284, lng: -49.2733 }, Fortaleza: { lat: -3.7319, lng: -38.5267 },
  "Porto Alegre": { lat: -30.0346, lng: -51.2177 },
};
const coords = (city: string) => CITY[city] ?? {};

async function skill(name: string) {
  return db.skill.upsert({ where: { name }, update: {}, create: { name } });
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.user.deleteMany({ where: { email: { endsWith: D } } }); // recria só os dados demo

  await db.user.create({ data: { name: "[Demo] Admin", email: `admin${D}`, passwordHash: adminHash, emailVerified: new Date(), role: "ADMIN" } });

  const companies = [
    { email: `mares${D}`, name: "[Demo] Marés Tecnologia", industry: "Tecnologia", location: "Recife", description: "Empresa fictícia de software para logística." },
    { email: `farol${D}`, name: "[Demo] Farol Saúde", industry: "Saúde", location: "São Paulo", description: "Empresa fictícia de serviços de saúde digital." },
  ];
  const profiles = [];
  for (const c of companies) {
    const u = await db.user.create({ data: { name: c.name, email: c.email, passwordHash, emailVerified: new Date(), role: "COMPANY",
      company: { create: { name: c.name, industry: c.industry, location: c.location, description: c.description } } }, include: { company: true } });
    profiles.push(u.company!);
  }

  const jobsData = [
    { c: 0, title: "Desenvolvedor(a) Front-end", area: "Tecnologia", location: "Recife", workMode: "HYBRID", contractType: "CLT", seniority: "MID", minYears: 2, salaryMin: 6000, salaryMax: 9000, skills: ["React", "TypeScript", "CSS"] },
    { c: 0, title: "Analista de Dados Júnior", area: "Tecnologia", location: "Recife", workMode: "REMOTE", contractType: "CLT", seniority: "JUNIOR", minYears: 0, salaryMin: 3500, salaryMax: 5000, skills: ["SQL", "Python", "Excel"] },
    { c: 0, title: "Estágio em Desenvolvimento", area: "Tecnologia", location: "Recife", workMode: "ONSITE", contractType: "INTERNSHIP", seniority: "INTERN", minYears: 0, salaryMin: 1500, salaryMax: 1800, skills: ["JavaScript", "Git"] },
    { c: 1, title: "Designer de Produto", area: "Design", location: "São Paulo", workMode: "REMOTE", contractType: "PJ", seniority: "SENIOR", minYears: 4, salaryMin: 9000, salaryMax: 13000, skills: ["Figma", "Pesquisa com usuários"] },
    { c: 1, title: "Analista de Atendimento", area: "Atendimento", location: "São Paulo", workMode: "ONSITE", contractType: "CLT", seniority: "JUNIOR", minYears: 1, salaryMin: 2600, salaryMax: 3200, skills: ["Comunicação", "Excel"] },
    { c: 1, title: "Engenheiro(a) de Software Back-end", area: "Tecnologia", location: "São Paulo", workMode: "HYBRID", contractType: "CLT", seniority: "SENIOR", minYears: 5, salaryMin: 12000, salaryMax: 16000, skills: ["Node.js", "PostgreSQL", "TypeScript"] },
  ] as const;
  const jobs = [];
  for (const j of jobsData) {
    const sk = await Promise.all(j.skills.map(skill));
    jobs.push(await db.job.create({ data: {
      companyId: profiles[j.c].id, title: j.title, description: `Vaga fictícia de demonstração para ${j.title}. Você vai trabalhar com times pequenos, entregas semanais e foco em qualidade.`,
      responsibilities: "Planejar, desenvolver e acompanhar entregas.", requirements: `Conhecimento em ${j.skills.join(", ")}.`, benefits: "Vale-refeição, plano de saúde",
      area: j.area, location: j.location, ...coords(j.location), workMode: j.workMode, contractType: j.contractType, seniority: j.seniority,
      minYears: j.minYears, salaryMin: j.salaryMin, salaryMax: j.salaryMax, skills: { create: sk.map((s) => ({ skillId: s.id })) } } }));
  }

  // Empresas fictícias extras (as mesmas que scripts/create-demo-companies.mjs cria no site publicado).
  type DemoJob = { title: string; area: string; location: string; workMode: "ONSITE" | "HYBRID" | "REMOTE"; contractType: "CLT" | "PJ" | "INTERNSHIP" | "TEMPORARY";
    seniority: "INTERN" | "JUNIOR" | "MID" | "SENIOR" | "LEAD"; minYears: number; salaryMin: number; salaryMax: number; skills: string[]; description: string };
  type DemoCompany = { email: string; name: string; industry: string; location: string; website: string; description: string; jobs: DemoJob[] };
  const extra: DemoCompany[] = JSON.parse(readFileSync(path.join(__dirname, "demo-companies.json"), "utf8"));
  let daysAgo = 1;
  for (const c of extra) {
    const u = await db.user.create({ data: { name: c.name, email: `${c.email}${D}`, passwordHash, emailVerified: new Date(), role: "COMPANY",
      company: { create: { name: c.name, industry: c.industry, location: c.location, description: c.description, website: c.website } } }, include: { company: true } });
    for (const j of c.jobs) {
      const sk = await Promise.all(j.skills.map(skill));
      await db.job.create({ data: {
        companyId: u.company!.id, title: j.title, description: j.description, requirements: `Conhecimento em ${j.skills.join(", ")}.`,
        benefits: "Vale-refeição, plano de saúde", area: j.area, location: j.location, ...coords(j.location), workMode: j.workMode, contractType: j.contractType, seniority: j.seniority,
        minYears: j.minYears, salaryMin: j.salaryMin, salaryMax: j.salaryMax, publishedAt: new Date(Date.now() - daysAgo++ * 86_400_000),
        skills: { create: sk.map((s) => ({ skillId: s.id })) } } });
    }
  }

  const candidates = [
    { name: "[Demo] Ana Costa", email: `ana${D}`, headline: "Desenvolvedora front-end", area: "Tecnologia", loc: "Recife", mode: "HYBRID", years: 3, skills: ["React", "TypeScript", "CSS", "Git"] },
    { name: "[Demo] Bruno Lima", email: `bruno${D}`, headline: "Analista de dados", area: "Tecnologia", loc: "Recife", mode: "REMOTE", years: 1, skills: ["SQL", "Python", "Excel"] },
    { name: "[Demo] Carla Mendes", email: `carla${D}`, headline: "Designer de produto", area: "Design", loc: "São Paulo", mode: "REMOTE", years: 5, skills: ["Figma", "Pesquisa com usuários"] },
  ] as const;
  const cps = [];
  for (const c of candidates) {
    const sk = await Promise.all(c.skills.map(skill));
    const u = await db.user.create({ data: { name: c.name, email: c.email, passwordHash, emailVerified: new Date(), role: "CANDIDATE", candidate: { create: {
      headline: c.headline, about: "Perfil fictício de demonstração.", interestArea: c.area, location: c.loc, workMode: c.mode, yearsExperience: c.years,
      skills: { create: sk.map((s) => ({ skillId: s.id })) },
      educations: { create: [{ institution: "Universidade Demo", course: "Curso de demonstração", startYear: 2018, endYear: 2022 }] },
      experiences: { create: [{ company: "Empresa Demo", role: c.headline, startDate: new Date("2022-03-01") }] } } } }, include: { candidate: true } });
    cps.push(u.candidate!);
  }

  const apps: [number, number, "SUBMITTED" | "IN_REVIEW" | "INTERVIEW"][] = [[0, 0, "INTERVIEW"], [1, 1, "IN_REVIEW"], [2, 3, "SUBMITTED"]];
  for (const [ci, ji, status] of apps) {
    const hist: ("SUBMITTED" | "IN_REVIEW" | "INTERVIEW")[] = ["SUBMITTED", "IN_REVIEW", "INTERVIEW"];
    await db.jobApplication.create({ data: { jobId: jobs[ji].id, candidateId: cps[ci].id, status, compatibility: 70 + ci * 10,
      history: { create: hist.slice(0, hist.indexOf(status) + 1).map((s) => ({ status: s })) } } });
  }
  // os mesmos dados de demonstração dos diferenciais que a migração aplica em produção
  const extras = ["20261127003000_demo_differentials", "20261127013000_notification_link"]
    .map((m) => readFileSync(path.join(__dirname, `migrations/${m}/migration.sql`), "utf8").replace(/^ALTER TABLE[^;]*;/m, "")).join(";\n");
  for (const stmt of extras.split(/;\s*\n/).map((x) => x.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean)) await db.$executeRawUnsafe(stmt);

  console.log(`Seed ok. ${process.env.SEED_PASSWORD ? "Senhas definidas por variável de ambiente (não exibidas)." : `Senha de todas as contas demo: ${PASSWORD}`}\n  admin${D}\n  mares${D} (empresa)\n  ana${D} (candidata)`);
}
main().finally(() => db.$disconnect());
