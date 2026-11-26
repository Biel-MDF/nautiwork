import { describe, expect, it } from "vitest";
import { MARKET_AREAS, marketAreaById, marketAreaOfJobArea } from "@/modules/market/areas";
import { analyzeProfile, type MatchJob } from "@/modules/market/match";
import { parentOf } from "@/lib/nav";
import { UI_DEFAULTS, sanitizeUi } from "@/lib/ui-prefs";

const job = (id: string, area: string, skills: string[], extra: Partial<MatchJob> = {}): MatchJob => ({
  id, title: `Vaga ${id}`, company: "Empresa", demo: false, area, location: "São Paulo", workMode: "REMOTE",
  contractType: "CLT", minYears: 0, salaryMin: null, salaryMax: null, skills, ...extra,
});

describe("áreas de mercado", () => {
  it("tem 20 áreas com ids únicos e conteúdo completo", () => {
    expect(MARKET_AREAS).toHaveLength(20);
    expect(new Set(MARKET_AREAS.map((a) => a.id)).size).toBe(20);
    for (const a of MARKET_AREAS) {
      expect(a.hardSkills.length, a.id).toBeGreaterThan(2);
      expect(a.roles.length, a.id).toBeGreaterThan(1);
      expect(a.sources.length, a.id).toBeGreaterThan(0);
      for (const v of Object.values(a.indicators)) expect(v >= 1 && v <= 5, `${a.id} indicador ${v}`).toBe(true);
    }
  });
  it("liga as áreas das vagas às áreas de mercado", () => {
    expect(marketAreaOfJobArea("Tecnologia")?.id).toBe("ti");
    expect(marketAreaOfJobArea("logística")?.id).toBe("logistica");
    expect(marketAreaById("direito")?.name).toBeTruthy();
    expect(marketAreaById("nao-existe")).toBeUndefined();
  });
});

describe("analyzeProfile", () => {
  const jobs = [
    job("a", "Tecnologia", ["React", "TypeScript", "CSS"]),
    job("b", "Tecnologia", ["Python", "SQL"]),
    job("c", "Logística", ["Excel", "Roteirização"], { workMode: "ONSITE", location: "Santos" }),
  ];

  it("ordena vagas pela compatibilidade e recomenda a área certa", () => {
    const r = analyzeProfile({ skills: ["React", "TypeScript"], workMode: "REMOTE", location: "São Paulo", yearsExperience: 1 }, jobs);
    expect(r.analyzed).toBe(3);
    expect(r.jobs[0].job.id).toBe("a");
    expect(r.jobs[0].missing).toEqual(["CSS"]);
    expect(r.areas[0].id).toBe("ti");
    expect(r.areas[0].reason.length).toBeGreaterThan(10);
  });

  it("aponta habilidades que faltam nas melhores vagas", () => {
    const r = analyzeProfile({ skills: ["React"], yearsExperience: 0 }, jobs);
    const names = r.skillsToLearn.map((s) => s.name);
    expect(names).toContain("TypeScript");
    expect(names).not.toContain("React");
  });

  it("funciona sem vagas, só com o que o mercado pede", () => {
    const r = analyzeProfile({ skills: ["Excel", "Contabilidade"], yearsExperience: 0 }, []);
    expect(r.jobs).toHaveLength(0);
    expect(r.areas.length).toBeGreaterThan(0);
  });
});

describe("botão Voltar sem histórico", () => {
  it("vai para a página pai", () => {
    expect(parentOf("/jobs/cmww7p6tk000mfs75xifnrij4")).toBe("/jobs");
    expect(parentOf("/company/jobs/cmww7p6tk000mfs75xifnrij4/edit")).toBe("/company/jobs");
    expect(parentOf("/candidate/profile")).toBe("/candidate/dashboard");
    expect(parentOf("/candidate/dashboard")).toBe("/");
    expect(parentOf("/mercado")).toBe("/");
  });
});

describe("preferências de interface", () => {
  it("aceita só valores conhecidos", () => {
    expect(sanitizeUi(null)).toEqual(UI_DEFAULTS);
    expect(sanitizeUi({ width: "wide", density: "xx", jobs: "grid" })).toEqual({ ...UI_DEFAULTS, width: "wide", jobs: "grid" });
  });
});
