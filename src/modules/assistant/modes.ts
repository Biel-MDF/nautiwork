// Modos do assistente (sem as instruções, para poder ser usado também no navegador).

/** Modos do assistente: cada um muda o objetivo da conversa (as regras e os dados são os mesmos). */
export const ASSISTANT_MODES = ["carreira", "curriculo", "entrevista", "empresa"] as const;
export type AssistantMode = (typeof ASSISTANT_MODES)[number];

/** Quem pode usar cada modo (visitante só o de carreira e o simulado). */
export function modeAllowed(mode: AssistantMode, role: "CANDIDATE" | "COMPANY" | "ADMIN" | "VISITOR") {
  if (mode === "curriculo") return role === "CANDIDATE";
  if (mode === "empresa") return role === "COMPANY";
  if (mode === "entrevista") return role === "CANDIDATE" || role === "VISITOR";
  return true;
}
