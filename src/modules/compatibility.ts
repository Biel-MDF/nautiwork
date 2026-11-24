// Compatibilidade baseada em regras. Pura, sem acesso a banco, 100% testável.
// Critérios que a vaga não define são ignorados e os pesos são renormalizados.

export type CandidateInput = {
  skills: string[]; interestArea?: string | null; workMode?: string | null;
  location?: string | null; yearsExperience: number;
};
export type JobInput = {
  skills: string[]; area: string; workMode: string; location: string; minYears: number;
};
export type Criterion = { key: string; label: string; weight: number; ratio: number; detail: string };
export type Compatibility = { score: number; criteria: Criterion[]; missingSkills: string[] };

const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function computeCompatibility(c: CandidateInput, j: JobInput): Compatibility {
  const criteria: Criterion[] = [];
  const have = new Set(c.skills.map(norm));
  const missingSkills = j.skills.filter((s) => !have.has(norm(s)));

  if (j.skills.length > 0) {
    const matched = j.skills.length - missingSkills.length;
    criteria.push({ key: "skills", label: "Habilidades", weight: 50, ratio: matched / j.skills.length,
      detail: `${matched} de ${j.skills.length} habilidades pedidas` });
  }
  if (c.interestArea) {
    const same = norm(c.interestArea) === norm(j.area);
    criteria.push({ key: "area", label: "Área de interesse", weight: 20, ratio: same ? 1 : 0,
      detail: same ? "Área coincide com seu interesse" : "Área diferente do seu interesse" });
  }
  if (c.workMode) {
    const same = c.workMode === j.workMode;
    criteria.push({ key: "mode", label: "Modalidade", weight: 10, ratio: same ? 1 : 0,
      detail: same ? "Modalidade preferida" : "Modalidade diferente da preferida" });
  }
  if (j.workMode !== "REMOTE" && c.location) {
    const same = norm(c.location) === norm(j.location);
    criteria.push({ key: "location", label: "Localização", weight: 10, ratio: same ? 1 : 0,
      detail: same ? "Mesma cidade" : "Cidade diferente" });
  }
  if (j.minYears > 0) {
    criteria.push({ key: "experience", label: "Experiência", weight: 10,
      ratio: Math.min(1, c.yearsExperience / j.minYears),
      detail: `${c.yearsExperience} de ${j.minYears} anos pedidos` });
  }

  const total = criteria.reduce((s, k) => s + k.weight, 0);
  const score = total === 0 ? 0 : Math.round((criteria.reduce((s, k) => s + k.weight * k.ratio, 0) / total) * 100);
  return { score, criteria, missingSkills };
}
