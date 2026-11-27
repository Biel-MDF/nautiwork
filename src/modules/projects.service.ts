// Projetos do curso técnico confirmados pelo professor. O aluno cadastra o projeto e o
// professor recebe um link de uso único (por e-mail, quando o envio estiver ativo, ou
// repassado pelo aluno). Ao abrir, o professor informa o nome e confirma a autoria.
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { actionMail, sendMail } from "@/lib/mailer";
import { projectSchema, projectValidationSchema } from "@/lib/validators";

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");
export const MAX_PROJECTS = 10;

export async function createProject(userId: string, raw: unknown, baseUrl: string) {
  const data = projectSchema.parse(raw);
  const p = await db.candidateProfile.findUnique({ where: { userId }, include: { user: { select: { name: true } }, _count: { select: { projects: true } } } });
  if (!p) throw new HttpError(400, "Perfil de candidato não encontrado.");
  if (p._count.projects >= MAX_PROJECTS) throw new HttpError(400, `Você pode cadastrar até ${MAX_PROJECTS} projetos.`);
  const token = randomBytes(32).toString("base64url");
  const project = await db.project.create({ data: { ...data, candidateId: p.id, tokenHash: hash(token) } });
  const link = `${baseUrl}/validar-projeto/${token}`;
  const student = p.user.name.replace(/\[[^\]]*\]\s*/g, "");
  const mail = await sendMail(actionMail(data.teacherEmail, `Confirme o projeto de ${student}`, `Olá, ${data.teacherName}.`,
    `${student} cadastrou no Nautiwork o projeto "${data.title}", feito em ${data.school}, e indicou você para confirmar a autoria. Se o projeto é mesmo desse aluno, confirme pelo botão abaixo. Se não for, ignore este e-mail.`,
    "Confirmar o projeto", link, "Você recebeu este e-mail porque um aluno indicou seu endereço no Nautiwork."));
  return { project, link, emailed: mail.sent };
}

export async function deleteProject(userId: string, projectId: string) {
  const project = await db.project.findUnique({ where: { id: projectId }, include: { candidate: { select: { userId: true } } } });
  if (!project || project.candidate.userId !== userId) throw new HttpError(404, "Projeto não encontrado.");
  await db.project.delete({ where: { id: projectId } });
}

export async function projectByToken(token: string) {
  if (!token || token.length < 20) return null;
  return db.project.findUnique({ where: { tokenHash: hash(token) }, include: { candidate: { include: { user: { select: { id: true, name: true } } } } } });
}

/** O próprio aluno logado não confirma o próprio projeto. O link vale uma vez. */
export async function validateProject(raw: unknown, viewerUserId: string | null) {
  const { token, teacherName, note } = projectValidationSchema.parse(raw);
  const project = await projectByToken(token);
  if (!project || project.validatedAt) throw new HttpError(404, "Este link não vale mais. Peça ao aluno um link novo.");
  if (viewerUserId && viewerUserId === project.candidate.user.id) throw new HttpError(403, "O próprio aluno não pode confirmar o projeto. Envie o link ao professor.");
  const { count } = await db.project.updateMany({ where: { id: project.id, validatedAt: null }, data: {
    validatedAt: new Date(), teacherName, validatorNote: note ?? null, tokenHash: null } });
  if (count === 0) throw new HttpError(404, "Este link não vale mais.");
  await db.notification.create({ data: { userId: project.candidate.user.id, title: "Projeto confirmado", link: "/candidate/resume", body: `${teacherName} confirmou o projeto "${project.title}". Ele aparece com o selo de confirmado no seu currículo.` } });
  return { ok: true };
}
