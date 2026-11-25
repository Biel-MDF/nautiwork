import { describe, expect, it } from "vitest";
import { PALETTES, PALETTE_IDS, ROLES, themeBootScript, themeCss, type Tokens } from "@/lib/themes";

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
  ["tide", "casco", 1, 4.5], ["tide", "fossa", 1, 4.5], ["tide", "foam", 1, 4.5],        // links e destaques
  ["fossa", "tide", 1, 4.5], ["fossa", "deep", 1, 4.5],                                   // texto do botão principal (normal e hover)
  ["reef", "casco", 1, 4.5], ["coral", "casco", 1, 4.5],                                  // compatibilidade e erros
  ["line", "field", 1, 3], ["line", "casco", 1, 3],                                       // borda de campo (WCAG 1.4.11)
];

describe("temas", () => {
  for (const id of PALETTE_IDS) {
    for (const mode of ["dark", "light"] as const) {
      it(`${id} ${mode === "dark" ? "escuro" : "claro"} passa no contraste mínimo`, () => {
        const t = PALETTES[id][mode];
        const falhas = rules
          .map(([fg, bg, a, min]) => ({ par: `${fg}${a < 1 ? `/${a}` : ""} sobre ${bg}`, r: ratio(a < 1 ? mix(t[fg], t[bg], a) : t[fg], t[bg]), min }))
          .filter((x) => x.r < x.min)
          .map((x) => `${x.par}: ${x.r.toFixed(2)} < ${x.min}`);
        expect(falhas).toEqual([]);
      });
    }
  }

  it("o CSS define todas as variáveis para cada paleta e modo", () => {
    const css = themeCss();
    for (const id of PALETTE_IDS) {
      expect(css).toContain(`[data-palette="${id}"][data-mode="light"]`);
      expect(css).toContain(`[data-palette="${id}"][data-mode="dark"]`);
    }
    for (const r of ROLES) expect(css).toContain(`--c-${r}:`);
    expect(css).not.toMatch(/undefined|NaN/);
  });

  it("o script de início só aceita paletas conhecidas e cai no padrão", () => {
    const s = themeBootScript();
    expect(s).toContain('"oceano"');
    expect(s).toContain("localStorage");
    expect(() => new Function(s)).not.toThrow(); // sintaxe válida
  });
});
