import { db } from "@/lib/db";
import { currentUser } from "@/lib/rbac";
import { computeCompatibility } from "./compatibility";
import { commuteFor } from "./geo";

type ScorableJob = { id: string; area: string; workMode: string; location: string; minYears: number; skills: { skill: { name: string } }[]; lat?: number | null; lng?: number | null };

/**
 * Contexto de quem está vendo uma lista de vagas:
 * - visitante: marcador leva ao login;
 * - candidato: compatibilidade de cada vaga e marcador ligado nas vagas salvas;
 * - empresa/admin: nada extra.
 */
/** Visitante sem sessão, sem ler cookies: deixa a página ser montada de antemão. */
export function visitorViewer(): Awaited<ReturnType<typeof jobViewer>> {
  return { user: null, save: () => "login" as const, score: () => undefined, home: null, commute: () => null };
}

export async function jobViewer() {
  const user = await currentUser();
  const none = { home: null, commute: () => null };
  if (!user) return { user, save: () => "login" as const, score: () => undefined, ...none };
  if (user.role !== "CANDIDATE") return { user, save: () => undefined, score: () => undefined, ...none };

  const profile = await db.candidateProfile.findUnique({
    where: { userId: user.id },
    select: { interestArea: true, workMode: true, location: true, yearsExperience: true, lat: true, lng: true,
      skills: { select: { skill: { select: { name: true } } } }, savedJobs: { select: { jobId: true } } },
  });
  const saved = new Set(profile?.savedJobs.map((s) => s.jobId));
  const mine = profile && { skills: profile.skills.map((s) => s.skill.name), interestArea: profile.interestArea, workMode: profile.workMode,
    location: profile.location, yearsExperience: profile.yearsExperience };
  const home = profile && profile.lat != null && profile.lng != null ? { lat: profile.lat, lng: profile.lng } : null;
  return {
    user,
    home,
    /** minutos estimados de transporte público até a vaga (só com CEP no perfil e vaga presencial ou híbrida) */
    commute: (j: { lat?: number | null; lng?: number | null; workMode: string }) => commuteFor(home, { lat: j.lat ?? null, lng: j.lng ?? null, workMode: j.workMode })?.minutes ?? null,
    save: (jobId: string) => (saved.has(jobId) ? "saved" as const : "unsaved" as const),
    // sem habilidades nem área no perfil, a nota não diz nada: melhor não mostrar
    score: (j: ScorableJob) => (mine && (mine.skills.length > 0 || mine.interestArea)
      ? computeCompatibility(mine, { skills: j.skills.map((s) => s.skill.name), area: j.area, workMode: j.workMode, location: j.location, minYears: j.minYears }).score
      : undefined),
  };
}
