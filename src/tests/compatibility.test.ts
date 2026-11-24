import { describe, expect, it } from "vitest";
import { computeCompatibility } from "@/modules/compatibility";

const job = { skills: ["React", "TypeScript", "SQL", "Docker"], area: "Tecnologia", workMode: "REMOTE", location: "Recife", minYears: 2 };

describe("computeCompatibility", () => {
  it("dá 100% quando tudo coincide", () => {
    const r = computeCompatibility({ skills: ["react", "typescript", "sql", "docker"], interestArea: "tecnologia", workMode: "REMOTE", location: "Recife", yearsExperience: 3 }, job);
    expect(r.score).toBe(100);
    expect(r.missingSkills).toEqual([]);
  });
  it("calcula parcial e lista habilidades ausentes", () => {
    const r = computeCompatibility({ skills: ["React", "SQL"], interestArea: "Tecnologia", workMode: "REMOTE", yearsExperience: 1 }, job);
    // skills 25/50, area 20/20, modo 10/10, exp 5/10 => 60/90
    expect(r.score).toBe(67);
    expect(r.missingSkills).toEqual(["TypeScript", "Docker"]);
  });
  it("ignora acentos e caixa", () => {
    const r = computeCompatibility({ skills: ["  REACT "], yearsExperience: 0 }, { ...job, skills: ["react"], minYears: 0 });
    expect(r.score).toBe(100);
  });
  it("ignora localização em vagas remotas", () => {
    const r = computeCompatibility({ skills: ["react"], location: "Manaus", yearsExperience: 0 }, { ...job, skills: ["react"], minYears: 0 });
    expect(r.criteria.find((c) => c.key === "location")).toBeUndefined();
  });
  it("retorna 0 sem critérios avaliáveis", () => {
    expect(computeCompatibility({ skills: [], yearsExperience: 0 }, { ...job, skills: [], minYears: 0 }).score).toBe(0);
  });
});
