// "Quem viu meu currículo": cada empresa que abre o currículo completo de um candidato fica
// registrada (uma linha por empresa, com contagem e datas). Só conta quem pode ver: a empresa
// precisa ter recebido candidatura dessa pessoa. Reaberturas em menos de 30 minutos não somam.
import { db } from "@/lib/db";
import { emailNotify } from "./notify";

const SAME_VISIT_MS = 30 * 60_000;

export async function recordResumeView(companyId: string, candidateId: string, now = new Date()) {
  const prev = await db.resumeView.findUnique({ where: { candidateId_companyId: { candidateId, companyId } } });
  if (prev) {
    if (now.getTime() - prev.lastAt.getTime() < SAME_VISIT_MS) return prev;
    return db.resumeView.update({ where: { id: prev.id }, data: { count: { increment: 1 }, lastAt: now } });
  }
  try {
    const view = await db.resumeView.create({ data: { candidateId, companyId, firstAt: now, lastAt: now } });
    // primeira vez desta empresa: avisa o candidato
    const [company, candidate] = await Promise.all([
      db.companyProfile.findUnique({ where: { id: companyId }, select: { name: true } }),
      db.candidateProfile.findUnique({ where: { id: candidateId }, select: { userId: true } }),
    ]);
    if (company && candidate) {
      const name = company.name.replace(/\[[^\]]*\]\s*/g, "");
      const title = "Uma empresa abriu seu currículo";
      const body = `${name} abriu o seu currículo completo. Veja a lista em Quem viu meu currículo.`;
      await db.notification.create({ data: { userId: candidate.userId, title, body } });
      await emailNotify([candidate.userId], title, body, "/candidate/views");
    }
    return view;
  } catch {
    // duas abas abrindo ao mesmo tempo: a outra já criou a linha
    return db.resumeView.findUnique({ where: { candidateId_companyId: { candidateId, companyId } } });
  }
}
