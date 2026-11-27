// Provas de habilidade: sorteio, prazo de 10 minutos, correção no servidor e selo "comprovada".
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { RETRY_DAYS, TIME_LIMIT_MIN, drawQuestions, grade, questionsFromIds, testBySlug } from "./skill-tests/bank";
import { normText } from "./market/areas";
import { z } from "zod";

const DAY = 86_400_000;
const submitSchema = z.object({ answers: z.array(z.number().int().min(0).max(3)).max(10) });

async function profileOf(userId: string) {
  const p = await db.candidateProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!p) throw new HttpError(400, "Perfil de candidato não encontrado.");
  return p;
}

export async function startCheck(userId: string, slug: string, now = new Date()) {
  const test = testBySlug(slug);
  if (!test) throw new HttpError(404, "Prova não encontrada.");
  const p = await profileOf(userId);
  const limitMs = (TIME_LIMIT_MIN + 1) * 60_000;
  // prova abandonada conta como tentativa: sem isso, daria para abrir várias vezes e ver todas as questões
  await db.skillCheck.updateMany({ where: { candidateId: p.id, skill: test.slug, finishedAt: null, startedAt: { lt: new Date(now.getTime() - limitMs) } },
    data: { finishedAt: now, score: 0, passed: false } });
  const open = await db.skillCheck.findFirst({ where: { candidateId: p.id, skill: test.slug, finishedAt: null }, orderBy: { startedAt: "desc" } });
  if (open) {
    const remainingMs = TIME_LIMIT_MIN * 60_000 - (now.getTime() - open.startedAt.getTime());
    return { id: open.id, skill: test.name, timeLimitMin: Math.max(0, remainingMs) / 60_000, resumed: true,
      questions: questionsFromIds(test, open.questionIds).map((x) => ({ prompt: x.prompt, options: x.options })) };
  }
  const last = await db.skillCheck.findFirst({ where: { candidateId: p.id, skill: test.slug, finishedAt: { not: null } }, orderBy: { startedAt: "desc" } });
  if (last?.passed) throw new HttpError(409, "Você já passou nesta prova.");
  if (last && now.getTime() - last.finishedAt!.getTime() < RETRY_DAYS * DAY) {
    const days = Math.ceil((RETRY_DAYS * DAY - (now.getTime() - last.finishedAt!.getTime())) / DAY);
    throw new HttpError(429, `Você pode tentar de novo em ${days} ${days === 1 ? "dia" : "dias"}. Use esse tempo para estudar o tema.`);
  }
  const questions = drawQuestions(test);
  const check = await db.skillCheck.create({ data: { candidateId: p.id, skill: test.slug, questionIds: questions.map((x) => x.id), total: questions.length, startedAt: now } });
  return { id: check.id, skill: test.name, timeLimitMin: TIME_LIMIT_MIN, resumed: false, questions: questions.map((x) => ({ prompt: x.prompt, options: x.options })) };
}

export async function submitCheck(userId: string, checkId: string, raw: unknown, now = new Date()) {
  const { answers } = submitSchema.parse(raw);
  const p = await profileOf(userId);
  const check = await db.skillCheck.findUnique({ where: { id: checkId } });
  if (!check || check.candidateId !== p.id) throw new HttpError(404, "Prova não encontrada.");
  if (check.finishedAt) throw new HttpError(409, "Esta prova já foi enviada.");
  const test = testBySlug(check.skill)!;
  const late = now.getTime() - check.startedAt.getTime() > (TIME_LIMIT_MIN + 1) * 60_000;
  const result = late ? { score: 0, total: check.total, passed: false } : grade(test, check.questionIds, answers);
  // só a primeira conclusão vale: duas abas enviando juntas não corrigem duas vezes
  const { count } = await db.skillCheck.updateMany({ where: { id: check.id, finishedAt: null }, data: { finishedAt: now, score: result.score, passed: result.passed } });
  if (count === 0) throw new HttpError(409, "Esta prova já foi enviada.");
  if (result.passed) {
    // marca as habilidades do perfil que correspondem à prova; se nenhuma, inclui a habilidade com o nome da prova
    const mine = await db.candidateSkill.findMany({ where: { candidateId: p.id }, include: { skill: true } });
    const names = new Set([test.slug, normText(test.name), ...test.aliases]);
    const match = mine.filter((m) => names.has(normText(m.skill.name)));
    if (match.length) await db.candidateSkill.updateMany({ where: { candidateId: p.id, skillId: { in: match.map((m) => m.skillId) } }, data: { verifiedAt: now } });
    else {
      const skill = await db.skill.upsert({ where: { name: test.name }, update: {}, create: { name: test.name } });
      await db.candidateSkill.upsert({ where: { candidateId_skillId: { candidateId: p.id, skillId: skill.id } },
        create: { candidateId: p.id, skillId: skill.id, verifiedAt: now }, update: { verifiedAt: now } });
    }
  }
  return { ...result, late, skill: test.name };
}
