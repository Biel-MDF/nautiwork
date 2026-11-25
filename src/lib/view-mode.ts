// Modo de visualização do admin: ver o site como visitante, candidato ou empresa.
// Arquivo sem banco de dados, para poder ser usado também no middleware (edge).

export const VIEW_COOKIE = "nw_view";
export const viewModes = ["visitor", "candidate", "company"] as const;
export type ViewMode = (typeof viewModes)[number];

export const viewModeLabel: Record<ViewMode, string> = { visitor: "Visitante", candidate: "Candidato", company: "Empresa" };
/** Onde cada modo começa. */
export const viewModeHome: Record<ViewMode | "admin", string> = { visitor: "/", candidate: "/candidate/dashboard", company: "/company/dashboard", admin: "/admin/dashboard" };
/**
 * Contas usadas para mostrar a visão de candidato e de empresa. Só contas da demonstração:
 * o admin nunca entra na visão de um usuário real.
 */
export const viewModeAccount = { candidate: "ana@demo.nautiwork.test", company: "mares@demo.nautiwork.test" } as const;

export function parseViewMode(v: string | undefined): ViewMode | null {
  return (viewModes as readonly string[]).includes(v ?? "") ? (v as ViewMode) : null;
}
