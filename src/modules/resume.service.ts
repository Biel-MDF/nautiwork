import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { educationSchema, experienceSchema } from "@/lib/validators";

async function candidateIdOf(userId: string) {
  const profile = await db.candidateProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new HttpError(400, "Perfil de candidato não encontrado.");
  return profile.id;
}

// Item de outro candidato responde 404, e não 403, para não revelar que o id existe.
async function ownedEducation(userId: string, id: string) {
  const candidateId = await candidateIdOf(userId);
  const item = await db.education.findUnique({ where: { id } });
  if (!item || item.candidateId !== candidateId) throw new HttpError(404, "Formação não encontrada.");
  return item;
}

async function ownedExperience(userId: string, id: string) {
  const candidateId = await candidateIdOf(userId);
  const item = await db.experience.findUnique({ where: { id } });
  if (!item || item.candidateId !== candidateId) throw new HttpError(404, "Experiência não encontrada.");
  return item;
}

export async function addEducation(userId: string, raw: unknown) {
  const data = educationSchema.parse(raw);
  const candidateId = await candidateIdOf(userId);
  if ((await db.education.count({ where: { candidateId } })) >= 20) throw new HttpError(422, "Limite de 20 formações atingido.");
  return db.education.create({ data: { ...data, endYear: data.endYear ?? null, candidateId } });
}

export async function updateEducation(userId: string, id: string, raw: unknown) {
  await ownedEducation(userId, id);
  const data = educationSchema.parse(raw);
  return db.education.update({ where: { id }, data: { ...data, endYear: data.endYear ?? null } });
}

export async function deleteEducation(userId: string, id: string) {
  await ownedEducation(userId, id);
  await db.education.delete({ where: { id } });
  return { ok: true };
}

export async function addExperience(userId: string, raw: unknown) {
  const data = experienceSchema.parse(raw);
  const candidateId = await candidateIdOf(userId);
  if ((await db.experience.count({ where: { candidateId } })) >= 30) throw new HttpError(422, "Limite de 30 experiências atingido.");
  return db.experience.create({ data: { ...data, endDate: data.endDate ?? null, candidateId } });
}

export async function updateExperience(userId: string, id: string, raw: unknown) {
  await ownedExperience(userId, id);
  const data = experienceSchema.parse(raw);
  return db.experience.update({ where: { id }, data: { ...data, endDate: data.endDate ?? null } });
}

export async function deleteExperience(userId: string, id: string) {
  await ownedExperience(userId, id);
  await db.experience.delete({ where: { id } });
  return { ok: true };
}
