import { db } from "@/lib/db";
import { currentUser } from "@/lib/rbac";
import { computeCompatibility } from "./compatibility";

type ScorableJob = { id: string; area: string; workMode: string; location: string; minYears: number; skills: { skill: { name: string } }[] };

/**
 * Contexto de quem está vendo uma lista de vagas:
 * - visitante: marcador leva ao login;
 * - candidato: compatibilidade de cada vaga e marcador ligado nas vagas salvas;
 * - empresa/admin: nada extra.
 */
export async function jobViewer() {
  const user = await currentUser();
  if (!user) return { user, save: () => "login" as const, score: () => undefined };
  if (user.role !== "CANDIDATE") return { user, save: () => undefined, score: () => undefined };

  const profile = await db.candidateProfile.findUnique({
    where: { userId: user.id },
    select: { interestArea: true, workMode: true, location: true, yearsExperience: true,
      skills: { select: { skill: { select: { name: true } } } }, savedJobs: { select: { jobId: true } } },
  });
  const saved = new Set(profile?.savedJobs.map((s) => s.jobId));
  const mine = profile && { skills: profile.skills.map((s) => s.skill.name), interestArea: profile.interestArea, workMode: profile.workMode,
    location: profile.location, yearsExperience: profile.yearsExperience };
  return {
    user,
    save: (jobId: string) => (saved.has(jobId) ? "saved" as const : "unsaved" as const),
    // sem habilidades nem área no perfil, a nota não diz nada: melhor não mostrar
    score: (j: ScorableJob) => (mine && (mine.skills.length > 0 || mine.interestArea)
      ? computeCompatibility(mine, { skills: j.skills.map((s) => s.skill.name), area: j.area, workMode: j.workMode, location: j.location, minYears: j.minYears }).score
      : undefined),
  };
}
