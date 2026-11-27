// Estimativa das cotas legais a partir do que a empresa informa. Não é parecer jurídico.
// Aprendiz (CLT art. 429): de 5% a 15% dos trabalhadores cujas funções exigem formação
//   profissional; a fração vira um aprendiz a mais. Micro e pequenas empresas são dispensadas.
//   Usamos o total de funcionários como aproximação dessa base, e o site diz isso.
// PcD (Lei 8.213/1991, art. 93): empresas com 100 ou mais empregados reservam 2% (até 200),
//   3% (201 a 500), 4% (501 a 1.000) ou 5% (acima de 1.000).

export const COMPANY_SIZES = { MEI: "MEI", ME: "Microempresa (ME)", EPP: "Empresa de pequeno porte (EPP)", MEDIUM: "Média empresa", LARGE: "Grande empresa" } as const;
export type CompanySize = keyof typeof COMPANY_SIZES;

export function pcdRate(employees: number) {
  if (employees < 100) return 0;
  if (employees <= 200) return 0.02;
  if (employees <= 500) return 0.03;
  if (employees <= 1000) return 0.04;
  return 0.05;
}

export function estimateQuotas(input: { employees: number; size: CompanySize; apprentices?: number | null; pcdEmployees?: number | null }) {
  const smallExempt = input.size === "MEI" || input.size === "ME" || input.size === "EPP";
  const apprenticeMin = smallExempt || input.employees < 7 ? 0 : Math.ceil(input.employees * 0.05);
  const apprenticeMax = smallExempt || input.employees < 7 ? 0 : Math.floor(input.employees * 0.15);
  const rate = pcdRate(input.employees);
  const pcdMin = Math.ceil(input.employees * rate);
  const hasA = input.apprentices ?? 0, hasP = input.pcdEmployees ?? 0;
  return {
    apprentice: { required: apprenticeMin > 0, min: apprenticeMin, max: Math.max(apprenticeMin, apprenticeMax), current: hasA, missing: Math.max(0, apprenticeMin - hasA), exemptReason: smallExempt ? "Micro e pequenas empresas não são obrigadas a contratar aprendizes (podem contratar se quiserem)." : input.employees < 7 ? "Com menos de 7 funcionários, a cota mínima não se aplica." : null },
    pcd: { required: rate > 0, rate, min: pcdMin, current: hasP, missing: Math.max(0, pcdMin - hasP) },
  };
}
