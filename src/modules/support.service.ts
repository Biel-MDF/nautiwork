import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { actionMail, escapeHtml, sendMail } from "@/lib/mailer";
import { supportMessageSchema, supportStatusSchema, supportTicketSchema } from "@/lib/validators";
import { emailNotify } from "./notify";

export const supportCategoryLabel = {
  ACCOUNT: "Conta e acesso", JOBS: "Vagas", APPLICATIONS: "Candidaturas", BUG: "Erro no site", OTHER: "Outro assunto",
} as const;
export const supportStatusLabel = { OPEN: "Aguardando resposta", ANSWERED: "Respondido", CLOSED: "Encerrado" } as const;

const MAX_OPEN = 5;
const base = () => (process.env.APP_URL ?? "").replace(/\/+$/, "");
const plainName = (n: string) => n.replace(/\[[^\]]*\]\s*/g, "");

/** Avisa a equipe: notificação no site para cada admin e e-mail para o endereço de suporte (resposta vai direto ao usuário). */
async function alertStaff(ticketId: string, subject: string, intro: string, message: string, from: { name: string; email: string }) {
  const admins = await db.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } });
  if (admins.length) await db.notification.createMany({ data: admins.map((a) => ({ userId: a.id, title: "Suporte", body: `${intro}: "${subject}".` })) });
  const to = process.env.SUPPORT_EMAIL;
  if (!to) return;
  const mail = actionMail(to, `[Suporte Nautiwork] ${subject}`, `${intro}, enviado por ${plainName(from.name)} (${from.email}).`,
    message, "Abrir o pedido", `${base()}/admin/support/${ticketId}`, "Responda pelo painel para que a resposta fique registrada no histórico do pedido.");
  mail.html = mail.html.replace(`<p>${escapeHtml(message)}</p>`, `<p style="white-space:pre-line">${escapeHtml(message)}</p>`);
  await sendMail({ ...mail, replyTo: from.email });
}

export async function createTicket(userId: string, raw: unknown) {
  const { subject, category, message } = supportTicketSchema.parse(raw);
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } });
  const open = await db.supportTicket.count({ where: { userId, status: { not: "CLOSED" } } });
  if (open >= MAX_OPEN) throw new HttpError(429, `Você já tem ${MAX_OPEN} pedidos em aberto. Responda ou encerre um deles antes de abrir outro.`);
  const ticket = await db.supportTicket.create({
    data: { userId, subject, category, messages: { create: { authorId: userId, body: message } } },
  });
  await alertStaff(ticket.id, subject, "Novo pedido de suporte", message, user);
  return ticket;
}

async function loadTicket(id: string) {
  const t = await db.supportTicket.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true } } } });
  if (!t) throw new HttpError(404, "Pedido não encontrado.");
  return t;
}

/** Quem abriu responde ao próprio pedido; admin responde a qualquer um. Pedido de outra pessoa responde 404. */
export async function addMessage(userId: string, role: string, ticketId: string, raw: unknown) {
  const { body } = supportMessageSchema.parse(raw);
  const t = await loadTicket(ticketId);
  const staff = role === "ADMIN";
  if (!staff && t.userId !== userId) throw new HttpError(404, "Pedido não encontrado.");
  if (t.status === "CLOSED" && staff) throw new HttpError(409, "Este pedido está encerrado. Reabra antes de responder.");
  const msg = await db.$transaction(async (tx) => {
    const m = await tx.supportMessage.create({ data: { ticketId, authorId: userId, body, fromStaff: staff } });
    // Resposta da equipe marca como respondido; nova mensagem do usuário (inclusive em pedido encerrado) reabre.
    await tx.supportTicket.update({ where: { id: ticketId }, data: { status: staff ? "ANSWERED" : "OPEN" } });
    if (staff) await tx.notification.create({ data: { userId: t.userId, title: "Suporte respondeu", body: `Há uma resposta no seu pedido "${t.subject}".` } });
    return m;
  });
  if (staff) await emailNotify([t.userId], "Suporte respondeu", `Há uma resposta no seu pedido "${t.subject}":\n\n${body}`, `/support/${t.id}`);
  else await alertStaff(t.id, t.subject, "Nova mensagem em um pedido de suporte", body, t.user);
  return msg;
}

/** Admin muda para qualquer status; o próprio usuário só pode encerrar o seu pedido. */
export async function setTicketStatus(userId: string, role: string, ticketId: string, raw: unknown) {
  const { status } = supportStatusSchema.parse(raw);
  const t = await loadTicket(ticketId);
  if (role !== "ADMIN") {
    if (t.userId !== userId) throw new HttpError(404, "Pedido não encontrado.");
    if (status !== "CLOSED") throw new HttpError(403, "Para reabrir, envie uma nova mensagem no pedido.");
  }
  return db.supportTicket.update({ where: { id: ticketId }, data: { status } });
}
