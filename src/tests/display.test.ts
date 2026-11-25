import { describe, expect, it } from "vitest";
import { monogram, splitDemo, timeAgo } from "@/lib/display";

describe("splitDemo", () => {
  it("tira o prefixo [Demo] e marca a empresa como fictícia", () => {
    expect(splitDemo("[Demo] Âncora Logística")).toEqual({ name: "Âncora Logística", demo: true });
    expect(splitDemo("Empresa Real")).toEqual({ name: "Empresa Real", demo: false });
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-25T12:00:00Z");
  const ago = (d: number) => new Date(now.getTime() - d * 86_400_000);
  it("usa hoje, ontem, dias, semanas e meses", () => {
    expect(timeAgo(ago(0), now)).toBe("hoje");
    expect(timeAgo(ago(1), now)).toBe("ontem");
    expect(timeAgo(ago(3), now)).toBe("há 3 dias");
    expect(timeAgo(ago(7), now)).toBe("há 1 semana");
    expect(timeAgo(ago(20), now)).toBe("há 2 semanas");
    expect(timeAgo(ago(45), now)).toBe("há 1 mês");
    expect(timeAgo(ago(400), now)).toBe("há mais de um ano");
  });
});

describe("monogram", () => {
  it("pega as iniciais das duas primeiras palavras, ignorando [Demo] e preposições", () => {
    expect(monogram("[Demo] Âncora Logística")).toBe("ÂL");
    expect(monogram("Casa de Pães")).toBe("CP");
    expect(monogram("Nautiwork")).toBe("N");
  });
});
