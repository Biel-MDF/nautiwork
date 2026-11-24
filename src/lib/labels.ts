export const workModeLabel = { ONSITE: "Presencial", HYBRID: "Híbrido", REMOTE: "Remoto" } as const;
export const contractLabel = { CLT: "CLT", PJ: "PJ", INTERNSHIP: "Estágio", TEMPORARY: "Temporário" } as const;
export const seniorityLabel = { INTERN: "Estagiário", JUNIOR: "Júnior", MID: "Pleno", SENIOR: "Sênior", LEAD: "Liderança" } as const;
export const jobStatusLabel = { ACTIVE: "Ativa", PAUSED: "Pausada", CLOSED: "Encerrada" } as const;
export const appStatusLabel = {
  SUBMITTED: "Enviada", IN_REVIEW: "Em análise", IN_PROCESS: "Em processo seletivo",
  INTERVIEW: "Entrevista", APPROVED: "Aprovada", REJECTED: "Rejeitada", WITHDRAWN: "Retirada",
} as const;
export const appStatusTone: Record<string, string> = {
  SUBMITTED: "border-mist bg-foam text-abyss/90", IN_REVIEW: "border-tide/40 bg-tide/10 text-deep", IN_PROCESS: "border-tide/40 bg-tide/10 text-deep",
  INTERVIEW: "border-reef/40 bg-reef/10 text-reef", APPROVED: "border-reef/50 bg-reef/15 text-reef", REJECTED: "border-coral/40 bg-coral/10 text-coral",
  WITHDRAWN: "border-mist bg-transparent text-abyss/60",
};
export function salaryRange(min?: number | null, max?: number | null) {
  const f = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `a partir de ${f(min)}`;
  if (max) return `até ${f(max)}`;
  return null;
}
