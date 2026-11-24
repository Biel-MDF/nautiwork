import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { emailNotify } from "./notify";
import { jobSchema, jobSearchSchema } from "@/lib/validators";
import { connectSkills } from "./skills";

export const PAGE_SIZE = 12;

export async function searchJobs(input: z.input<typeof jobSearchSchema>) {
  const f = jobSearchSchema.parse(input);
  const where: Prisma.JobWhereInput = { status: "ACTIVE", flagged: false, company: { user: { active: true } } };
  if (f.q) where.OR = [
    { title: { contains: f.q, mode: "insensitive" } },
    { description: { contains: f.q, mode: "insensitive" } },
    { company: { name: { contains: f.q, mode: "insensitive" } } },
    { skills: { some: { skill: { name: { contains: f.q, mode: "insensitive" } } } } },
  ];
  if (f.area) where.area = { contains: f.area, mode: "insensitive" };
  if (f.location) where.location = { contains: f.location, mode: "insensitive" };
  if (f.workMode) where.workMode = f.workMode;
  if (f.contractType) where.contractType = f.contractType;
  if (f.minSalary) where.salaryMax = { gte: f.minSalary };
  if (f.days) where.publishedAt = { gte: new Date(Date.now() - f.days * 86_400_000) };
  const [items, total] = await Promise.all([
    db.job.findMany({
      where, orderBy: { publishedAt: "desc" }, skip: (f.page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { company: { select: { id: true, name: true } }, skills: { include: { skill: true } } },
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

export async function createJob(userId: string, raw: unknown) {
  const { skills, ...data } = jobSchema.parse(raw);
  const company = await getCompanyOf(userId);
  return db.$transaction(async (tx) =>
    tx.job.create({ data: { ...data, companyId: company.id, skills: { create: await connectSkills(tx, skills) } } }));
}

async function ownedJob(userId: string, jobId: string) {
  const job = await db.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job) throw new HttpError(404, "Vaga não encontrada.");
  if (job.company.userId !== userId) throw new HttpError(403, "Esta vaga pertence a outra empresa.");
  return job;
}

export async function updateJob(userId: string, jobId: string, raw: unknown) {
  await ownedJob(userId, jobId);
  const { skills, ...data } = jobSchema.parse(raw);
  return db.$transaction(async (tx) => {
    await tx.jobSkill.deleteMany({ where: { jobId } });
    return tx.job.update({ where: { id: jobId }, data: { ...data, skills: { create: await connectSkills(tx, skills) } } });
  });
}

export async function setJobStatus(userId: string, jobId: string, status: "ACTIVE" | "PAUSED" | "CLOSED") {
  const job = await ownedJob(userId, jobId);
  if (job.status === "CLOSED") throw new HttpError(409, "Vagas encerradas não podem ser reabertas.");
  const updated = await db.job.update({ where: { id: jobId }, data: { status } });
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
