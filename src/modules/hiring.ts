// Regras que mantêm as vagas honestas:
// 1. vaga com validade: sem confirmação da empresa por 30 dias, a vaga é pausada (vaga fantasma não fica no ar);
// 2. candidatura sem resposta: depois de 14 dias sem a empresa mexer, o candidato é avisado;
// 3. empresa que responde: taxa e tempo de resposta calculados das candidaturas reais.
// As varreduras rodam sozinhas com o uso do site (no máximo a cada 10 minutos por servidor)
// e são idempotentes: rodar duas vezes não pausa nem avisa ninguém em dobro.
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { invalidatePublic } from "@/lib/cache";
import { emailNotify } from "./notify";

export const JOB_VALID_DAYS = 30;
export const EXPIRY_WARN_DAYS = 7;
export const NO_REPLY_DAYS = 14;
export const RESPONSE_WINDOW_DAYS = 180;
export const MIN_DECIDED = 3;
/** Empresas de demonstração não têm ninguém para confirmar as vagas; ficam fora da validade. */
export const DEMO_EMAIL_DOMAIN = "@demo.nautiwork.test";

const DAY = 86_400_000;
const RESPONSE_STATUSES = ["IN_REVIEW", "IN_PROCESS", "INTERVIEW", "APPROVED", "REJECTED"] as const;

/* ---------- regras puras (testadas sem banco) ---------- */

export function jobValidity(confirmedAt: Date, now = new Date()) {
  const expiresAt = new Date(confirmedAt.getTime() + JOB_VALID_DAYS * DAY);
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / DAY);
  return { expiresAt, daysLeft, expired: daysLeft <= 0, warn: daysLeft > 0 && daysLeft <= EXPIRY_WARN_DAYS };
}

export type ResponseSample = { createdAt: Date; status: string; firstResponseAt: Date | null };
export type ResponseStats = { decided: number; responded: number; rate: number; medianDays: number | null; badge: boolean };

/**
 * Conta só candidaturas "decididas": as respondidas e as que já passaram do prazo sem resposta.
 * Candidaturas recentes ainda sem resposta não entram (a empresa ainda tem tempo).
 */
export function computeResponse(samples: ResponseSample[], now = new Date()): ResponseStats | null {
  const decidedList = samples.filter((s) => s.firstResponseAt || (s.status !== "WITHDRAWN" && now.getTime() - s.createdAt.getTime() >= NO_REPLY_DAYS * DAY));
  if (decidedList.length < MIN_DECIDED) return null;
  const days = decidedList.filter((s) => s.firstResponseAt)
    .map((s) => (s.firstResponseAt!.getTime() - s.createdAt.getTime()) / DAY).sort((a, b) => a - b);
  const responded = days.length;
  const rate = Math.round((responded / decidedList.length) * 100);
  const medianDays = responded ? Math.max(1, Math.ceil(responded % 2 ? days[(responded - 1) / 2] : (days[responded / 2 - 1] + days[responded / 2]) / 2)) : null;
  return { decided: decidedList.length, responded, rate, medianDays, badge: rate >= 80 && medianDays !== null && medianDays <= 7 };
}

export function noReplyDays(createdAt: Date, status: string, now = new Date()) {
  if (status !== "SUBMITTED") return 0;
  const d = Math.floor((now.getTime() - createdAt.getTime()) / DAY);
  return d >= NO_REPLY_DAYS ? d : 0;
}

/* ---------- consultas ---------- */

export async function responseStats(companyIds: string[], now = new Date()) {
  const out = new Map<string, ResponseStats | null>();
  if (companyIds.length === 0) return out;
  const apps = await db.jobApplication.findMany({
    where: { job: { companyId: { in: companyIds } }, createdAt: { gte: new Date(now.getTime() - RESPONSE_WINDOW_DAYS * DAY) } },
    select: { createdAt: true, status: true, job: { select: { companyId: true } },
      history: { where: { status: { in: [...RESPONSE_STATUSES] } }, orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } } },
  });
  const by = new Map<string, ResponseSample[]>();
  for (const a of apps) {
    const list = by.get(a.job.companyId) ?? [];
    list.push({ createdAt: a.createdAt, status: a.status, firstResponseAt: a.history[0]?.createdAt ?? null });
    by.set(a.job.companyId, list);
  }
  for (const id of companyIds) out.set(id, computeResponse(by.get(id) ?? [], now));
  return out;
}

/* ---------- ações ---------- */

/** A empresa confirma que ainda contrata: renova a validade e, se a vaga tinha saído do ar por isso, volta a publicá-la. */
export async function confirmJob(userId: string, jobId: string) {
  const job = await db.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job) throw new HttpError(404, "Vaga não encontrada.");
  if (job.company.userId !== userId) throw new HttpError(403, "Esta vaga pertence a outra empresa.");
  if (job.status === "CLOSED") throw new HttpError(409, "Vagas encerradas não podem ser renovadas.");
  const updated = await db.job.update({ where: { id: jobId }, data: {
    confirmedAt: new Date(), expiredAt: null, ...(job.expiredAt ? { status: "ACTIVE" as const } : {}) } });
  invalidatePublic();
  return updated;
}

/** Pausa as vagas sem confirmação há 30 dias e avisa cada empresa uma vez. */
export async function expireStaleJobs(now = new Date()) {
  const stale = await db.job.findMany({
    where: { status: "ACTIVE", confirmedAt: { lt: new Date(now.getTime() - JOB_VALID_DAYS * DAY) },
      company: { user: { NOT: { email: { endsWith: DEMO_EMAIL_DOMAIN } } } } },
    select: { id: true, title: true, company: { select: { userId: true } } },
  });
  if (stale.length === 0) return 0;
  // só pausa quem ainda está ativo: se duas varreduras correrem juntas, a segunda não acha nada
  const { count } = await db.job.updateMany({ where: { id: { in: stale.map((j) => j.id) }, status: "ACTIVE" }, data: { status: "PAUSED", expiredAt: now } });
  if (count === 0) return 0;
  const byCompany = new Map<string, string[]>();
  for (const j of stale) byCompany.set(j.company.userId, [...(byCompany.get(j.company.userId) ?? []), j.title]);
  const title = "Vagas pausadas por falta de confirmação";
  for (const [userId, titles] of byCompany) {
    const body = `${titles.length === 1 ? `A vaga "${titles[0]}" ficou` : `${titles.length} vagas ficaram`} ${JOB_VALID_DAYS} dias sem confirmação e saiu do ar. Se ainda está contratando, confirme em Minhas vagas para publicar de novo.`;
    await db.notification.create({ data: { userId, title, body, link: "/company/jobs" } });
    await emailNotify([userId], title, body, "/company/jobs");
  }
  invalidatePublic();
  return count;
}

/** Avisa o candidato quando a empresa passa 14 dias sem mexer na candidatura. */
export async function notifyNoReply(now = new Date()) {
  const late = await db.jobApplication.findMany({
    where: { status: "SUBMITTED", noReplyNotifiedAt: null, createdAt: { lt: new Date(now.getTime() - NO_REPLY_DAYS * DAY) } },
    select: { id: true, candidate: { select: { userId: true } }, job: { select: { title: true, company: { select: { name: true } } } } },
    take: 200,
  });
  for (const a of late) {
    const { count } = await db.jobApplication.updateMany({ where: { id: a.id, noReplyNotifiedAt: null }, data: { noReplyNotifiedAt: now } });
    if (count === 0) continue;
    const company = a.job.company.name.replace(/\[[^\]]*\]\s*/g, "");
    const title = "Sem retorno da empresa";
    const body = `${company} não respondeu à sua candidatura para "${a.job.title}" em ${NO_REPLY_DAYS} dias. Vale seguir buscando outras vagas enquanto isso.`;
    await db.notification.create({ data: { userId: a.candidate.userId, title, body, link: "/candidate/applications" } });
    await emailNotify([a.candidate.userId], title, body, "/candidate/applications");
  }
  return late.length;
}

/* ---------- acompanhamento dos primeiros 90 dias ---------- */

export const CHECKIN_DAYS = [30, 60, 90] as const;

/** Cria as perguntas de 30, 60 e 90 dias para cada contratação (uma para cada lado) e avisa. */
export async function createDueCheckins(now = new Date()) {
  const hires = await db.jobApplication.findMany({
    where: { status: "APPROVED", hiredAt: { not: null, gte: new Date(now.getTime() - 120 * DAY), lte: new Date(now.getTime() - CHECKIN_DAYS[0] * DAY) } },
    select: { id: true, hiredAt: true, candidateId: true, candidate: { select: { userId: true, user: { select: { name: true } } } },
      job: { select: { title: true, company: { select: { userId: true, name: true } } } }, checkins: { select: { day: true, role: true } } },
  });
  let created = 0;
  for (const h of hires) {
    const days = Math.floor((now.getTime() - h.hiredAt!.getTime()) / DAY);
    for (const day of CHECKIN_DAYS) {
      if (days < day) continue;
      for (const role of ["CANDIDATE", "COMPANY"] as const) {
        if (h.checkins.some((c) => c.day === day && c.role === role)) continue;
        try {
          const c = await db.hireCheckin.create({ data: { applicationId: h.id, candidateId: h.candidateId, day, role } });
          created++;
          const person = h.candidate.user.name.replace(/\[[^\]]*\]\s*/g, "");
          const company = h.job.company.name.replace(/\[[^\]]*\]\s*/g, "");
          await db.notification.create({ data: role === "CANDIDATE"
            ? { userId: h.candidate.userId, title: `Como estão seus ${day} dias?`, body: `Uma pergunta rápida sobre o trabalho em ${company}. Sua resposta é só sua; a empresa só fica sabendo se você pedir uma conversa.`, link: `/checkin/${c.id}` }
            : { userId: h.job.company.userId, title: `${day} dias de ${person}`, body: `Como está a pessoa contratada para "${h.job.title}"? Leva um minuto.`, link: `/checkin/${c.id}` } });
        } catch { /* outra varredura criou ao mesmo tempo (índice único) */ }
      }
    }
  }
  return created;
}

export async function answerCheckin(userId: string, id: string, raw: { score: number; wantsTalk: boolean; comment?: string }) {
  const c = await db.hireCheckin.findUnique({ where: { id }, include: { application: { include: { candidate: { include: { user: true } }, job: { include: { company: true } } } } } });
  if (!c) throw new HttpError(404, "Pergunta não encontrada.");
  const owner = c.role === "CANDIDATE" ? c.application.candidate.userId : c.application.job.company.userId;
  if (owner !== userId) throw new HttpError(404, "Pergunta não encontrada.");
  const { count } = await db.hireCheckin.updateMany({ where: { id, answeredAt: null }, data: {
    score: raw.score, wantsTalk: c.role === "CANDIDATE" ? raw.wantsTalk : false, comment: raw.comment ?? null, answeredAt: new Date() } });
  if (count === 0) throw new HttpError(409, "Esta pergunta já foi respondida.");
  // o candidato decide: só o pedido de conversa vai para a empresa, nunca a nota ou o comentário
  if (c.role === "CANDIDATE" && raw.wantsTalk) {
    const person = c.application.candidate.user.name.replace(/\[[^\]]*\]\s*/g, "");
    const title = "Pedido de conversa";
    const body = `${person}, contratado(a) para "${c.application.job.title}", pediu uma conversa sobre como está indo o trabalho (${c.day} dias).`;
    await db.notification.create({ data: { userId: c.application.job.company.userId, title, body, link: "/company/dashboard" } });
    await emailNotify([c.application.job.company.userId], title, body, "/company/dashboard");
  }
  return { ok: true };
}

let lastSweep = 0;
/** Chamada a cada página: roda as duas varreduras no máximo a cada 10 minutos por servidor. */
export async function maybeSweep(now = new Date()) {
  if (now.getTime() - lastSweep < 10 * 60_000) return;
  lastSweep = now.getTime();
  try {
    await expireStaleJobs(now);
    await notifyNoReply(now);
    await createDueCheckins(now);
  } catch (e) {
    console.error("[varredura] falhou:", (e as Error).message);
  }
}
