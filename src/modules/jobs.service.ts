import { jobCardCompany } from "@/lib/queries";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { emailNotify } from "./notify";
import { jobSchema, jobSearchSchema } from "@/lib/validators";
import { connectSkills } from "./skills";
import { invalidatePublic } from "@/lib/cache";
import { marketAreaById } from "./market/areas";
import { coherenceErrors, scanJobText } from "./job-safety";
import { geocodeCep, kmForMinutes } from "./geo";

export const PAGE_SIZE = 12;

export async function searchJobs(input: z.input<typeof jobSearchSchema>, home?: { lat: number | null; lng: number | null } | null) {
  const f = jobSearchSchema.parse(input);
  const where: Prisma.JobWhereInput = { status: "ACTIVE", flagged: false, company: { user: { active: true } } };
  if (f.q) where.OR = [
    { title: { contains: f.q, mode: "insensitive" } },
    { description: { contains: f.q, mode: "insensitive" } },
    { company: { name: { contains: f.q, mode: "insensitive" } } },
    { skills: { some: { skill: { name: { contains: f.q, mode: "insensitive" } } } } },
  ];
  if (f.area) where.area = { contains: f.area, mode: "insensitive" };
  const market = marketAreaById(f.mercado);
  if (market) where.AND = [{ OR: market.jobAreas.map((a) => ({ area: { equals: a, mode: "insensitive" as const } })) }];
  if (f.location) where.location = { contains: f.location, mode: "insensitive" };
  if (f.workMode) where.workMode = f.workMode;
  if (f.contractType) where.contractType = f.contractType;
  if (f.minSalary) where.salaryMax = { gte: f.minSalary };
  if (f.salary) where.salaryMin = { not: null };
  if (f.seniority) where.seniority = f.seniority;
  if (f.noExp) where.minYears = 0;
  if (f.aprendiz) where.forApprentice = true;
  if (f.pcd) where.pcdOnly = true;
  // deslocamento: caixa em volta da casa (estimativa), vagas remotas sempre entram
  if (f.maxMin && home?.lat != null && home?.lng != null) {
    const km = kmForMinutes(f.maxMin), dLat = km / 111, dLng = km / (111 * Math.cos((home.lat * Math.PI) / 180));
    const prev = where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : [];
    where.AND = [...prev, { OR: [
      { workMode: "REMOTE" },
      { lat: { gte: home.lat - dLat, lte: home.lat + dLat }, lng: { gte: home.lng - dLng, lte: home.lng + dLng } },
    ] }];
  }
  if (f.days) where.publishedAt = { gte: new Date(Date.now() - f.days * 86_400_000) };
  const [items, total] = await Promise.all([
    db.job.findMany({
      where, orderBy: { publishedAt: "desc" }, skip: (f.page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { company: jobCardCompany, skills: { include: { skill: true } } },
    }),
    db.job.count({ where }),
  ]);
  return { items, total, page: f.page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getCompanyOf(userId: string) {
  const company = await db.companyProfile.findUnique({ where: { userId } });
  if (!company) throw new HttpError(400, "Complete o perfil da empresa antes de publicar vagas.");
  return company;
}

/** Antes de salvar: coerência (iniciante sem pegadinha, aprendiz), antigolpe e localização. */
async function checkedJobData(raw: unknown) {
  const { skills, ...data } = jobSchema.parse(raw);
  const fields = coherenceErrors(data);
  const scan = scanJobText(data);
  if (scan.block.length) (fields.description ??= []).push(`O Nautiwork não publica vagas que ${scan.block.join(", ")}. Processo seletivo não cobra nada do candidato.`);
  if (Object.keys(fields).length) throw new HttpError(400, Object.values(fields)[0][0], fields);
  const place = data.postalCode ? await geocodeCep(data.postalCode) : null;
  return { skills, data: { ...data, lat: place?.lat ?? null, lng: place?.lng ?? null }, warn: scan.warn };
}

/** Sinal fraco de golpe: a vaga fica retida até a moderação olhar, e a empresa sabe por quê. */
async function holdForReview(jobId: string, title: string, companyUserId: string, warn: string[]) {
  if (!warn.length) return;
  await db.job.update({ where: { id: jobId }, data: { flagged: true } });
  const admins = await db.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } });
  await db.notification.createMany({ data: [
    { userId: companyUserId, title: "Vaga em análise", body: `"${title}" ficou em análise antes de ir ao ar porque o texto ${warn.join(", ")}. A equipe libera em breve; se for engano, edite o texto.` },
    ...admins.map((a) => ({ userId: a.id, title: "Vaga para revisar", body: `"${title}" foi retida automaticamente: ${warn.join(", ")}.` })),
  ] });
}

export async function createJob(userId: string, raw: unknown) {
  const { skills, data, warn } = await checkedJobData(raw);
  const company = await getCompanyOf(userId);
  const job = await db.$transaction(async (tx) =>
    tx.job.create({ data: { ...data, companyId: company.id, skills: { create: await connectSkills(tx, skills) } } }));
  await holdForReview(job.id, job.title, userId, warn);
  invalidatePublic();
  return warn.length ? { ...job, flagged: true } : job;
}

async function ownedJob(userId: string, jobId: string) {
  const job = await db.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job) throw new HttpError(404, "Vaga não encontrada.");
  if (job.company.userId !== userId) throw new HttpError(403, "Esta vaga pertence a outra empresa.");
  return job;
}

export async function updateJob(userId: string, jobId: string, raw: unknown) {
  await ownedJob(userId, jobId);
  const { skills, data, warn } = await checkedJobData(raw);
  const job = await db.$transaction(async (tx) => {
    await tx.jobSkill.deleteMany({ where: { jobId } });
    return tx.job.update({ where: { id: jobId }, data: { ...data, confirmedAt: new Date(), skills: { create: await connectSkills(tx, skills) } } });
  });
  await holdForReview(job.id, job.title, userId, warn);
  invalidatePublic();
  return warn.length ? { ...job, flagged: true } : job;
}

export async function setJobStatus(userId: string, jobId: string, status: "ACTIVE" | "PAUSED" | "CLOSED") {
  const job = await ownedJob(userId, jobId);
  if (job.status === "CLOSED") throw new HttpError(409, "Vagas encerradas não podem ser reabertas.");
  // reativar conta como confirmar que ainda contrata
  const updated = await db.job.update({ where: { id: jobId }, data: status === "ACTIVE" ? { status, confirmedAt: new Date(), expiredAt: null } : { status } });
  invalidatePublic();
  if (status === "CLOSED") {
    const apps = await db.jobApplication.findMany({
      where: { jobId, status: { in: ["SUBMITTED", "IN_REVIEW", "IN_PROCESS", "INTERVIEW"] } },
      include: { candidate: true },
    });
    await db.notification.createMany({ data: apps.map((a) => ({
      userId: a.candidate.userId, title: "Vaga encerrada", body: `A vaga "${job.title}" foi encerrada pela empresa.` })) });
    await emailNotify(apps.map((a) => a.candidate.userId), "Vaga encerrada", `A vaga "${job.title}" foi encerrada pela empresa.`, "/candidate/applications");
  }
  return updated;
}
