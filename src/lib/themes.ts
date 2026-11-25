/**
 * Temas do Nautiwork: cinco paletas, cada uma com versão escura e clara.
 *
 * Fonte única das cores. O CSS das variáveis (themeCss), o script que aplica o tema antes
 * da primeira pintura (themeBootScript) e o teste de contraste leem esta tabela.
 * Os nomes dos papéis vêm do tema original: fossa = fundo, casco = cartões, foam = superfície
 * elevada, mist = borda, abyss = texto, tide = destaque, deep = destaque secundário,
 * reef = sucesso e compatibilidade, coral = erro, field = fundo de campo, line = borda de campo.
 * Cada combinação passa no teste de contraste (src/tests/themes.test.ts).
 */
export const ROLES = ["fossa", "casco", "foam", "mist", "abyss", "tide", "deep", "reef", "coral", "field", "line"] as const;
export type Role = (typeof ROLES)[number];
export type Tokens = Record<Role, string>;

export const PALETTES = {
  oceano: {
    name: "Oceano", description: "Azul sonar, o tema original",
    dark: {"fossa": "#030A1A","casco": "#071631","foam": "#0D2347","mist": "#1A3866","abyss": "#E3EDFB","tide": "#5CB8FF","deep": "#9CD3FF","reef": "#3DE3C3","coral": "#FF8270","field": "#050F23","line": "#4269A1"},
    light: {"fossa": "#F2F6FB","casco": "#FFFFFF","foam": "#E4EDF8","mist": "#C6D5E9","abyss": "#050D1A","tide": "#0A62BC","deep": "#084A8F","reef": "#04795F","coral": "#B93A26","field": "#FFFFFF","line": "#7A8FAD"},
  },
  lagoa: {
    name: "Lagoa", description: "Verde-água",
    dark: {"fossa": "#021413","casco": "#062320","foam": "#0B322E","mist": "#174D47","abyss": "#DFF5F1","tide": "#3FD9C2","deep": "#97EDE0","reef": "#A6E36F","coral": "#FF8270","field": "#03191A","line": "#3B7F77"},
    light: {"fossa": "#EFF7F5","casco": "#FFFFFF","foam": "#DDF0EC","mist": "#BCDCD6","abyss": "#03110F","tide": "#087567","deep": "#065A4F","reef": "#3F7A12","coral": "#B93A26","field": "#FFFFFF","line": "#6F9A94"},
  },
  coral: {
    name: "Coral", description: "Tons quentes",
    dark: {"fossa": "#170A0B","casco": "#261214","foam": "#34191C","mist": "#55292E","abyss": "#FBE9E6","tide": "#FF9478","deep": "#FFC2B2","reef": "#3DE3C3","coral": "#FF6B88","field": "#1C0C0E","line": "#9A5A60"},
    light: {"fossa": "#FBF4F2","casco": "#FFFFFF","foam": "#F7E5E0","mist": "#EACDC6","abyss": "#180709","tide": "#B83D12","deep": "#922F0C","reef": "#04795F","coral": "#B4123D","field": "#FFFFFF","line": "#A88780"},
  },
  abissal: {
    name: "Abissal", description: "Violeta profundo",
    dark: {"fossa": "#0B0820","casco": "#150F32","foam": "#1E1744","mist": "#33285F","abyss": "#ECE8FB","tide": "#AE95FF","deep": "#D3C6FF","reef": "#3DE3C3","coral": "#FF8270","field": "#0E0A26","line": "#6E5FAD"},
    light: {"fossa": "#F5F3FD","casco": "#FFFFFF","foam": "#ECE7FB","mist": "#D6CDF2","abyss": "#0D0820","tide": "#6431D4","deep": "#4E22AC","reef": "#04795F","coral": "#B93A26","field": "#FFFFFF","line": "#8C80B3"},
  },
  alga: {
    name: "Alga", description: "Verde-musgo",
    dark: {"fossa": "#06120A","casco": "#0C1F12","foam": "#132E1B","mist": "#21472B","abyss": "#E5F4E7","tide": "#7DD88F","deep": "#B7ECC0","reef": "#5CD9E6","coral": "#FF8270","field": "#081A0E","line": "#45784F"},
    light: {"fossa": "#F2F8F2","casco": "#FFFFFF","foam": "#E1F0E3","mist": "#C4DDC8","abyss": "#06120A","tide": "#2B7336","deep": "#1F5A28","reef": "#0B6E80","coral": "#B93A26","field": "#FFFFFF","line": "#7C9A80"},
  },
} satisfies Record<string, { name: string; description: string; dark: Tokens; light: Tokens }>;

export type PaletteId = keyof typeof PALETTES;
export type ModeChoice = "dark" | "light" | "system";
export const DEFAULT_PALETTE: PaletteId = "oceano";
export const DEFAULT_MODE: ModeChoice = "dark";
export const THEME_STORAGE_KEY = "nw-theme";
export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

function vars(t: Tokens, mode: "dark" | "light") {
  const parts = ROLES.map((r) => `--c-${r}:${rgb(t[r])}`);
  // brilho do fundo, véu atrás de janelas e sombras: mais fortes no escuro
  parts.push(mode === "dark" ? "--glow-a:.16;--scrim:1 5 16;--scrim-a:.75;--shade-a:.6" : "--glow-a:.10;--scrim:10 20 40;--scrim-a:.4;--shade-a:.16");
  parts.push(`color-scheme:${mode}`);
  return parts.join(";");
}

/** CSS com as variáveis de todas as combinações. Sem atributos no <html>, vale Oceano escuro. */
export function themeCss(): string {
  const out: string[] = [];
  const base = PALETTES[DEFAULT_PALETTE];
  out.push(`:root{${vars(base.dark, "dark")}}`);
  for (const id of PALETTE_IDS) {
    const p = PALETTES[id];
    out.push(`:root[data-palette="${id}"],:root[data-palette="${id}"][data-mode="dark"]{${vars(p.dark, "dark")}}`);
    out.push(`:root[data-palette="${id}"][data-mode="light"]{${vars(p.light, "light")}}`);
  }
  // sem paleta escolhida, mas com modo claro
  out.push(`:root:not([data-palette])[data-mode="light"]{${vars(base.light, "light")}}`);
  return out.join("\n");
}

/** Roda no <head>, antes da pintura: aplica a escolha salva e evita o "piscar" do tema errado. */
export function themeBootScript(): string {
  const ids = JSON.stringify(PALETTE_IDS);
  return `(function(){try{var s=JSON.parse(localStorage.getItem("${THEME_STORAGE_KEY}")||"{}");var ids=${ids};var p=ids.indexOf(s.palette)>=0?s.palette:"${DEFAULT_PALETTE}";var m=s.mode==="light"||s.mode==="system"?s.mode:"${DEFAULT_MODE}";var r=document.documentElement;var q=window.matchMedia("(prefers-color-scheme: light)");function apply(){r.dataset.mode=m==="system"?(q.matches?"light":"dark"):m}r.dataset.palette=p;r.dataset.theme=m;apply();if(m==="system"&&q.addEventListener)q.addEventListener("change",apply)}catch(e){}})();`;
}

/** Cor de fundo da combinação, para a barra do navegador no celular (meta theme-color). */
export function backgroundOf(palette: PaletteId, mode: "dark" | "light"): string {
  return PALETTES[palette][mode].fossa;
}
