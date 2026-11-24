import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { appStatusLabel } from "@/lib/labels";
import { emailNotify } from "./notify";
import { applySchema, statusSchema } from "@/lib/validators";
import { computeCompatibility } from "./compatibility";

export async function applyToJob(userId: string, raw: unknown) {
  const { jobId, coverNote } = applySchema.parse(raw);
  const profile = await db.candidateProfile.findUnique({
    where: { userId }, include: { skills: { include: { skill: true } }, user: true },
  });
  if (!profile || !profile.headline || profile.skills.length === 0)
    throw new HttpError(422, "Complete seu perfil (título profissional e ao menos uma habilidade) antes de se candidatar.");

  const job = await db.job.findUnique({
    where: { id: jobId }, include: { skills: { include: { skill: true } }, company: true },
  });
  if (!job || job.status !== "ACTIVE" || job.flagged) throw new HttpError(409, "Esta vaga não está mais recebendo candidaturas.");

  const compat = computeCompatibility(
    { skills: profile.skills.map((s) => s.skill.name), interestArea: profile.interestArea,
      workMode: profile.workMode, location: profile.location, yearsExperience: profile.yearsExperience },
    { skills: job.skills.map((s) => s.skill.name), area: job.area, workMode: job.workMode,
      location: job.location, minYears: job.minYears },
  );

  try {
    const created = await db.$transaction(async (tx) => {
      const app = await tx.jobApplication.create({
        data: { jobId, candidateId: profile.id, coverNote, compatibility: compat.score,
          history: { create: { status: "SUBMITTED", changedById: userId } } },
      });
      await tx.notification.createMany({ data: [
        { userId, title: "Candidatura enviada", body: `Você se candidatou a "${job.title}" em ${job.company.name}.` },
        { userId: job.company.userId, title: "Nova candidatura", body: `${profile.user.name} se candidatou a "${job.title}".` },
      ] });
      return app;
    });
    await emailNotify([job.company.userId], "Nova candidatura", `${profile.user.name} se candidatou a "${job.title}".`, "/company/applications");
    return created;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      throw new HttpError(409, "Você já se candidatou a esta vaga.");
    throw e;
  }
}

export async function updateApplicationStatus(userId: string, applicationId: string, raw: unknown) {
  const { status } = statusSchema.parse(raw);
  const app = await db.jobApplication.findUnique({
    where: { id: applicationId }, include: { job: { include: { company: true } }, candidate: true },
  });
  if (!app) throw new HttpError(404, "Candidatura não encontrada.");
  if (app.job.company.userId !== userId) throw new HttpError(403, "Esta candidatura pertence a outra empresa.");
  if (app.status === "WITHDRAWN") throw new HttpError(409, "O candidato retirou esta candidatura.");
  if (app.status === status) return app;
  const body = `Sua candidatura para "${app.job.title}" passou para a etapa "${appStatusLabel[status]}".`;
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.jobApplication.update({ where: { id: applicationId }, data: { status } });
    await tx.applicationStatusHistory.create({ data: { applicationId, status, changedById: userId } });
    await tx.notification.create({ data: { userId: app.candidate.userId, title: "Candidatura atualizada", body } });
    return u;
  });
  await emailNotify([app.candidate.userId], "Candidatura atualizada", body, "/candidate/applications");
  return updated;
}

export async function withdrawApplication(userId: string, applicationId: string) {
  const app = await db.jobApplication.findUnique({ where: { id: applicationId }, include: { candidate: true } });
  if (!app || app.candidate.userId !== userId) throw new HttpError(404, "Candidatura não encontrada.");
  if (["APPROVED", "REJECTED", "WITHDRAWN"].includes(app.status))
    throw new HttpError(409, "Esta candidatura não pode mais ser retirada.");
  return db.$transaction(async (tx) => {
    const updated = await tx.jobApplication.update({ where: { id: applicationId }, data: { status: "WITHDRAWN" } });
    await tx.applicationStatusHistory.create({ data: { applicationId, status: "WITHDRAWN", changedById: userId } });
    return updated;
  });
}
