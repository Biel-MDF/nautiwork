import { describe, expect, it } from "vitest";
import { CUSTOM_GROUP_IDS, PALETTES, PALETTE_IDS, ROLES, customCss, customTokens, sanitizeCustom, themeBootScript, themeCss, type CustomTheme, type Tokens } from "@/lib/themes";

// Contraste WCAG 2.x entre duas cores em hexadecimal
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// texto com opacidade (ex.: text-abyss/60) misturado ao fundo
const mix = (fg: string, bg: string, a: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(fg.slice(i, i + 2), 16) * a + parseInt(bg.slice(i, i + 2), 16) * (1 - a)).toString(16).padStart(2, "0")).join("");

// [texto, fundo, opacidade do texto, mínimo]
const rules: [keyof Tokens, keyof Tokens, number, number][] = [
  ["abyss", "fossa", 1, 7], ["abyss", "casco", 1, 7],
  ["abyss", "casco", 0.6, 4.5], ["abyss", "fossa", 0.6, 4.5], ["abyss", "foam", 0.6, 4.5], // menor opacidade de texto usada no site
  ["tide", "casco", 1, 4.5], ["tide", "fossa", 1, 4.5], ["tide", "foam", 1, 4.5],        // links e destaques em texto
  ["deep", "casco", 1, 4.5], ["deep", "fossa", 1, 4.5],
  ["onaccent", "accent", 1, 4.5], ["onaccent", "accentb", 1, 4.5],                        // texto do botão, nas duas pontas do degradê
  ["reef", "casco", 1, 4.5], ["coral", "casco", 1, 4.5],                                  // compatibilidade e erros
  ["line", "field", 1, 3], ["line", "casco", 1, 3],                                       // borda de campo (WCAG 1.4.11)
];
const failures = (t: Tokens) => rules
  .map(([fg, bg, a, min]) => ({ par: `${fg}${a < 1 ? `/${a}` : ""} sobre ${bg}`, r: ratio(a < 1 ? mix(t[fg], t[bg], a) : t[fg], t[bg]), min }))
  .filter((x) => x.r < x.min)
  .map((x) => `${x.par}: ${x.r.toFixed(2)} < ${x.min}`);

describe("temas prontos", () => {
  for (const id of PALETTE_IDS) for (const mode of ["dark", "light"] as const) {
    it(`${id} ${mode === "dark" ? "escuro" : "claro"} passa no contraste mínimo`, () => expect(failures(PALETTES[id][mode])).toEqual([]));
  }
});

describe("tema personalizado", () => {
  it("todas as combinações da tabela passam no contraste, nos dois modos", () => {
    const bad: string[] = [];
    let total = 0;
    const combos = (i: number, acc: Partial<CustomTheme>) => {
      if (i === CUSTOM_GROUP_IDS.length) {
        total++;
        for (const mode of ["dark", "light"] as const) {
          const f = failures(customTokens(acc as CustomTheme, mode));
          if (f.length) bad.push(`${JSON.stringify(acc)} ${mode}: ${f[0]}`);
        }
        return;
      }
      for (const id of PALETTE_IDS) combos(i + 1, { ...acc, [CUSTOM_GROUP_IDS[i]]: id });
    };
    combos(0, {});
    expect(total).toBe(PALETTE_IDS.length ** CUSTOM_GROUP_IDS.length);
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it("valores desconhecidos voltam para o padrão", () => {
    const c = sanitizeCustom({ fundo: "inexistente", destaque: "alga" });
    expect(PALETTE_IDS).toContain(c.fundo);
    expect(c.destaque).toBe("alga");
    expect(sanitizeCustom("lixo")).toEqual(sanitizeCustom({}));
  });

  it("o CSS do tema personalizado cobre os dois modos e todos os papéis", () => {
    const css = customCss(sanitizeCustom({}));
    expect(css).toContain(':root[data-palette="custom"]{');
    expect(css).toContain(':root[data-palette="custom"][data-mode="light"]{');
    for (const r of ROLES) expect(css).toContain(`--c-${r}:`);
  });
});

describe("CSS e script de início", () => {
  it("o CSS define todas as variáveis para cada paleta e modo", () => {
    const css = themeCss();
    for (const id of PALETTE_IDS) {
      expect(css).toContain(`:root[data-palette="${id}"]{`);
      expect(css).toContain(`:root[data-palette="${id}"][data-mode="light"]{`);
    }
    for (const r of ROLES) expect(css).toContain(`--c-${r}:`);
    expect(css).not.toMatch(/undefined|NaN/);
  });

  it("o script de início tem sintaxe válida e monta o tema personalizado", () => {
    const s = themeBootScript();
    expect(() => new Function(s)).not.toThrow();
    expect(s).toContain("nw-custom");
    expect(s).toContain('"oceano"');
  });
});
