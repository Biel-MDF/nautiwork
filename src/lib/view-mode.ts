// Modo de visualização do admin: ver o site como visitante, candidato ou empresa.
// Arquivo sem banco de dados, para poder ser usado também no middleware (edge).

export const VIEW_COOKIE = "nw_view";
export const viewModes = ["visitor", "candidate", "company"] as const;
export type ViewMode = (typeof viewModes)[number];

export const viewModeLabel: Record<ViewMode, string> = { visitor: "Visitante", candidate: "Candidato", company: "Empresa" };
/** Onde cada modo começa. */
export const viewModeHome: Record<ViewMode | "admin", string> = { visitor: "/", candidate: "/candidate/dashboard", company: "/company/dashboard", admin: "/admin/dashboard" };
/** Papel que o admin assume em cada visão, com a própria conta (e o próprio perfil de candidato ou empresa). */
export const viewModeRole = { candidate: "CANDIDATE", company: "COMPANY" } as const;

export function parseViewMode(v: string | undefined): ViewMode | null {
  return (viewModes as readonly string[]).includes(v ?? "") ? (v as ViewMode) : null;
}
