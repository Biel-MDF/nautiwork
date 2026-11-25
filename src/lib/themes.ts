/**
 * Temas do Nautiwork: sete paletas, cada uma com versão escura e clara, e um tema
 * personalizado montado a partir das cores das paletas.
 *
 * Fonte única das cores. O CSS das variáveis (themeCss / customCss), o script que aplica o
 * tema antes da primeira pintura (themeBootScript) e o teste de contraste leem esta tabela.
 *
 * Papéis: fossa = fundo, casco = cartões, foam = superfície elevada, mist = borda,
 * abyss = texto, tide = links e destaques em texto, deep = destaque secundário,
 * accent/accentb = preenchimento do botão principal (início e fim do degradê),
 * onaccent = texto sobre o botão, accent2 = cor de brilho decorativo, reef = sucesso e
 * compatibilidade, coral = erro, field = fundo de campo, line = borda de campo.
 * Cada paleta e cada combinação do tema personalizado passam no teste de contraste
 * (src/tests/themes.test.ts).
 */
export const ROLES = ["fossa", "casco", "foam", "mist", "abyss", "tide", "deep", "accent", "accentb", "onaccent", "accent2", "reef", "coral", "field", "line"] as const;
export type Role = (typeof ROLES)[number];
export type Tokens = Record<Role, string>;

export const PALETTES = {
  oceano: {
    name: "Oceano", description: "Azul sonar, o tema original",
    dark: { fossa: "#030A1A", casco: "#071631", foam: "#0D2347", mist: "#1A3866", abyss: "#E3EDFB", tide: "#5CB8FF", deep: "#9CD3FF", reef: "#3DE3C3", coral: "#FF8270", field: "#050F23", line: "#4269A1", accent: "#5CB8FF", accentb: "#6EE7FF", onaccent: "#030A1A", accent2: "#6EE7FF" },
    light: { fossa: "#EDF4FF", casco: "#FFFFFF", foam: "#E0EBFD", mist: "#C2D4F2", abyss: "#050D1A", tide: "#0A5CBD", deep: "#084A8F", reef: "#04795F", coral: "#B93A26", field: "#FFFFFF", line: "#7A8FB0", accent: "#1260D6", accentb: "#0A6FB0", onaccent: "#FFFFFF", accent2: "#22D3EE" },
  },
  lagoa: {
    name: "Lagoa", description: "Ciano e verde-água",
    dark: { fossa: "#021413", casco: "#062320", foam: "#0B322E", mist: "#174D47", abyss: "#DFF5F1", tide: "#3FD9C2", deep: "#97EDE0", reef: "#A6E36F", coral: "#FF8270", field: "#03191A", line: "#3B7F77", accent: "#3FD9C2", accentb: "#5CB8FF", onaccent: "#021413", accent2: "#5CB8FF" },
    light: { fossa: "#EBFAF8", casco: "#FFFFFF", foam: "#D8F3EF", mist: "#B4E0D9", abyss: "#03110F", tide: "#076E63", deep: "#065A50", reef: "#3F7A12", coral: "#B93A26", field: "#FFFFFF", line: "#6E9A93", accent: "#0A7D70", accentb: "#0B6E9C", onaccent: "#FFFFFF", accent2: "#3B82F6" },
  },
  alga: {
    name: "Alga", description: "Verde vivo",
    dark: { fossa: "#06120A", casco: "#0C1F12", foam: "#132E1B", mist: "#21472B", abyss: "#E5F4E7", tide: "#72E683", deep: "#B7F0C0", reef: "#5CD9E6", coral: "#FF8270", field: "#081A0E", line: "#45784F", accent: "#72E683", accentb: "#C8F25C", onaccent: "#06120A", accent2: "#C8F25C" },
    light: { fossa: "#EEFAEF", casco: "#FFFFFF", foam: "#DCF3DF", mist: "#BAE0C0", abyss: "#06120A", tide: "#1A7029", deep: "#165F22", reef: "#0B6E80", coral: "#B93A26", field: "#FFFFFF", line: "#779C7E", accent: "#178032", accentb: "#0E7A5A", onaccent: "#FFFFFF", accent2: "#A3E635" },
  },
  farol: {
    name: "Farol", description: "Laranja quente",
    dark: { fossa: "#160C05", casco: "#24140A", foam: "#331D0F", mist: "#553218", abyss: "#FCEFE4", tide: "#FFA94D", deep: "#FFCB94", reef: "#3DE3C3", coral: "#FF6B88", field: "#1B0F07", line: "#9A6640", accent: "#FFA94D", accentb: "#FF7AAE", onaccent: "#160C05", accent2: "#FF6BAE" },
    light: { fossa: "#FFF3E8", casco: "#FFFFFF", foam: "#FFE6D1", mist: "#F3CBAA", abyss: "#1A0B03", tide: "#A84308", deep: "#8F3A07", reef: "#04795F", coral: "#B4123D", field: "#FFFFFF", line: "#B08A6E", accent: "#BF4E0A", accentb: "#B8285F", onaccent: "#FFFFFF", accent2: "#FF6BAE" },
  },
  ambar: {
    name: "Âmbar", description: "Amarelo dourado",
    dark: { fossa: "#141005", casco: "#221B0A", foam: "#30270F", mist: "#50421A", abyss: "#FBF5E3", tide: "#FFD54A", deep: "#FFE69A", reef: "#3DE3C3", coral: "#FF8270", field: "#19140A", line: "#8F7A3A", accent: "#FFD54A", accentb: "#FFA94D", onaccent: "#141005", accent2: "#FF8A3D" },
    light: { fossa: "#FFF9E5", casco: "#FFFFFF", foam: "#FFF1C4", mist: "#EFDB97", abyss: "#151002", tide: "#805A00", deep: "#664700", reef: "#04795F", coral: "#B93A26", field: "#FFFFFF", line: "#A8935A", accent: "#FFC727", accentb: "#FFA51F", onaccent: "#1A1300", accent2: "#FF8A3D" },
  },
  anemona: {
    name: "Anêmona", description: "Rosa e magenta",
    dark: { fossa: "#14060F", casco: "#220C1B", foam: "#301228", mist: "#511F43", abyss: "#FBE8F4", tide: "#FF6EC7", deep: "#FFADDF", reef: "#3DE3C3", coral: "#FF8A70", field: "#1A0814", line: "#9A4D84", accent: "#FF6EC7", accentb: "#B98CFF", onaccent: "#14060F", accent2: "#B57BFF" },
    light: { fossa: "#FFF0FA", casco: "#FFFFFF", foam: "#FCE0F2", mist: "#F1C0E2", abyss: "#17061A", tide: "#AD1277", deep: "#8C0F61", reef: "#04795F", coral: "#B93A26", field: "#FFFFFF", line: "#B07FA3", accent: "#C2188A", accentb: "#8E2BC2", onaccent: "#FFFFFF", accent2: "#B57BFF" },
  },
  abissal: {
    name: "Abissal", description: "Violeta profundo",
    dark: { fossa: "#0B0820", casco: "#150F32", foam: "#1E1744", mist: "#33285F", abyss: "#ECE8FB", tide: "#AE95FF", deep: "#D3C6FF", reef: "#3DE3C3", coral: "#FF8270", field: "#0E0A26", line: "#6E5FAD", accent: "#AE95FF", accentb: "#7CC8FF", onaccent: "#0B0820", accent2: "#5CE1FF" },
    light: { fossa: "#F3EFFF", casco: "#FFFFFF", foam: "#E9E2FF", mist: "#D2C6F5", abyss: "#0D0820", tide: "#6431D4", deep: "#4E22AC", reef: "#04795F", coral: "#B93A26", field: "#FFFFFF", line: "#8C80B3", accent: "#6B33DD", accentb: "#B5237F", onaccent: "#FFFFFF", accent2: "#22D3EE" },
  },
} satisfies Record<string, { name: string; description: string; dark: Tokens; light: Tokens }>;

export type PaletteId = keyof typeof PALETTES;
export type Mode = "dark" | "light";
export type ModeChoice = Mode | "system";
export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];
export const DEFAULT_PALETTE: PaletteId = "oceano";
export const DEFAULT_MODE: ModeChoice = "dark";
export const THEME_STORAGE_KEY = "nw-theme";

/**
 * Tema personalizado: cada linha da tabela escolhe de qual paleta vem um grupo de cores.
 * Os grupos foram separados de modo que qualquer combinação mantenha o contraste.
 */
export const CUSTOM_GROUPS = {
  fundo: { label: "Fundo e texto", hint: "Cor do fundo, dos cartões e das bordas", roles: ["fossa", "casco", "foam", "mist", "abyss", "field", "line"] },
  destaque: { label: "Destaque", hint: "Botões, links e erros", roles: ["tide", "deep", "accent", "accentb", "onaccent", "coral"] },
  brilho: { label: "Brilho", hint: "Cor dos reflexos decorativos do fundo", roles: ["accent2"] },
  sucesso: { label: "Sucesso", hint: "Compatibilidade e confirmações", roles: ["reef"] },
} as const satisfies Record<string, { label: string; hint: string; roles: readonly Role[] }>;
export type CustomGroup = keyof typeof CUSTOM_GROUPS;
export const CUSTOM_GROUP_IDS = Object.keys(CUSTOM_GROUPS) as CustomGroup[];
export type CustomTheme = Record<CustomGroup, PaletteId>;
export const DEFAULT_CUSTOM: CustomTheme = { fundo: "oceano", destaque: "anemona", brilho: "abissal", sucesso: "oceano" };

export type ThemeChoice = { palette: PaletteId | "custom"; mode: ModeChoice; custom?: CustomTheme };

export function customTokens(c: CustomTheme, mode: Mode): Tokens {
  const out = {} as Tokens;
  for (const g of CUSTOM_GROUP_IDS) for (const r of CUSTOM_GROUPS[g].roles) out[r] = PALETTES[c[g]][mode][r];
  return out;
}

export function sanitizeCustom(c: unknown): CustomTheme {
  const src = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_CUSTOM };
  for (const g of CUSTOM_GROUP_IDS) if (PALETTE_IDS.includes(src[g] as PaletteId)) out[g] = src[g] as PaletteId;
  return out;
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

// Efeitos que mudam com o modo: brilhos do fundo, véu atrás de janelas e sombras.
// glow = brilho no topo; corner/corner2 = brilhos nos cantos; wave = ondas de luz à direita.
// No escuro ficam discretos (o tema escuro original quase não muda); no claro, bem visíveis.
const MODE_EXTRAS: Record<Mode, string> = {
  dark: "--glow-a:.16;--corner-a:.10;--corner2-a:.07;--wave-a:.12;--scrim:1 5 16;--scrim-a:.75;--shade-a:.6;color-scheme:dark",
  light: "--glow-a:.22;--corner-a:.46;--corner2-a:.40;--wave-a:.3;--scrim:10 20 40;--scrim-a:.4;--shade-a:.16;color-scheme:light",
};

function vars(t: Tokens, mode: Mode) {
  return ROLES.map((r) => `--c-${r}:${rgb(t[r])}`).join(";") + ";" + MODE_EXTRAS[mode];
}

/** CSS com as variáveis de todas as paletas. Sem atributos no <html>, vale Oceano escuro. */
export function themeCss(): string {
  const base = PALETTES[DEFAULT_PALETTE];
  const out = [`:root{${vars(base.dark, "dark")}}`, `:root:not([data-palette])[data-mode="light"]{${vars(base.light, "light")}}`];
  for (const id of PALETTE_IDS) {
    const p = PALETTES[id];
    out.push(`:root[data-palette="${id}"]{${vars(p.dark, "dark")}}`);
    out.push(`:root[data-palette="${id}"][data-mode="light"]{${vars(p.light, "light")}}`);
  }
  return out.join("\n");
}

/** CSS do tema personalizado, nos dois modos. Vai numa <style id="nw-custom"> própria. */
export function customCss(c: CustomTheme): string {
  return `:root[data-palette="custom"]{${vars(customTokens(c, "dark"), "dark")}}\n:root[data-palette="custom"][data-mode="light"]{${vars(customTokens(c, "light"), "light")}}`;
}

/**
 * Roda no <head>, antes da pintura: aplica a escolha salva e evita o "piscar" do tema errado.
 * Para o tema personalizado, monta o CSS a partir da tabela de grupos embutida.
 */
export function themeBootScript(): string {
  // grupos[paleta][modo][grupo] = "--c-x:r g b;..." (só o necessário para montar o personalizado)
  const groups: Record<string, Record<Mode, Record<string, string>>> = {};
  for (const id of PALETTE_IDS) {
    groups[id] = { dark: {}, light: {} };
    for (const m of ["dark", "light"] as const)
      for (const g of CUSTOM_GROUP_IDS) groups[id][m][g] = CUSTOM_GROUPS[g].roles.map((r) => `--c-${r}:${rgb(PALETTES[id][m][r])}`).join(";");
  }
  const def = JSON.stringify(DEFAULT_CUSTOM);
  return `(function(){try{var s=JSON.parse(localStorage.getItem("${THEME_STORAGE_KEY}")||"{}");var G=${JSON.stringify(groups)};var X=${JSON.stringify(MODE_EXTRAS)};var gs=${JSON.stringify(CUSTOM_GROUP_IDS)};var p=s.palette==="custom"||G[s.palette]?s.palette:"${DEFAULT_PALETTE}";var m=s.mode==="light"||s.mode==="system"||s.mode==="dark"?s.mode:"${DEFAULT_MODE}";var r=document.documentElement;if(p==="custom"){var c=${def};var u=s.custom||{};gs.forEach(function(g){if(G[u[g]])c[g]=u[g]});var css=["dark","light"].map(function(md){return ':root[data-palette="custom"]'+(md==="light"?'[data-mode="light"]':"")+"{"+gs.map(function(g){return G[c[g]][md][g]}).join(";")+";"+X[md]+"}"}).join("\\n");var st=document.createElement("style");st.id="nw-custom";st.textContent=css;document.head.appendChild(st)}var q=window.matchMedia("(prefers-color-scheme: light)");function apply(){r.dataset.mode=m==="system"?(q.matches?"light":"dark"):m}r.dataset.palette=p;r.dataset.theme=m;apply();if(m==="system"&&q.addEventListener)q.addEventListener("change",apply)}catch(e){}})();`;
}

/** Cor de fundo da combinação, para a barra do navegador no celular (meta theme-color). */
export function backgroundOf(choice: ThemeChoice, mode: Mode): string {
  if (choice.palette === "custom") return PALETTES[sanitizeCustom(choice.custom).fundo][mode].fossa;
  return PALETTES[choice.palette][mode].fossa;
}
