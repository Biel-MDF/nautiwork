// Denúncia de vaga suspeita. Três denúncias de pessoas diferentes retêm a vaga para a moderação.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { invalidatePublic } from "@/lib/cache";
import { reportSchema } from "@/lib/validators";

export const REPORT_REASONS = {
  SCAM: "Pede dinheiro, Pix ou dados bancários",
  FAKE: "Parece uma vaga falsa ou que não existe",
  DISCRIMINATION: "Tem conteúdo discriminatório",
  WRONG_INFO: "Informações erradas (salário, local, requisitos)",
  OTHER: "Outro motivo",
} as const;
export const AUTO_HOLD_REPORTS = 3;

export async function reportJob(userId: string, jobId: string, raw: unknown) {
  const { reason, details } = reportSchema.parse(raw);
  const job = await db.job.findUnique({ where: { id: jobId }, select: { id: true, title: true, flagged: true, company: { select: { userId: true } } } });
  if (!job) throw new HttpError(404, "Vaga não encontrada.");
  if (job.company.userId === userId) throw new HttpError(400, "Você não pode denunciar a própria vaga.");
  try {
    await db.jobReport.create({ data: { jobId, userId, reason: details ? `${reason}: ${details}` : reason } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Você já denunciou esta vaga. A equipe vai analisar.");
    throw e;
  }
  const count = await db.jobReport.count({ where: { jobId } });
  const admins = await db.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } });
  const held = count >= AUTO_HOLD_REPORTS && !job.flagged;
  if (held) {
    await db.job.update({ where: { id: jobId }, data: { flagged: true } });
    invalidatePublic();
  }
  await db.notification.createMany({ data: admins.map((a) => ({ userId: a.id, title: held ? "Vaga retida por denúncias" : "Nova denúncia de vaga",
    body: `"${job.title}" recebeu ${count} ${count === 1 ? "denúncia" : "denúncias"} (${REPORT_REASONS[reason]}).${held ? " Ela saiu do ar até a revisão." : ""}` })) });
  return { count, held };
}
