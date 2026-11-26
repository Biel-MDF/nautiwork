// Análise de perfil sem conta: compara os dados que a pessoa digitou com todas as vagas
// abertas (mesma regra da compatibilidade) e com o que o mercado pede em cada área.
// Função pura: recebe as vagas prontas, não acessa o banco.
import { computeCompatibility, type CandidateInput } from "../compatibility";
import { MARKET_AREAS, marketAreaOfJobArea, normText, type MarketArea } from "./areas";

export type MatchJob = {
  id: string; title: string; company: string; demo: boolean; area: string; location: string;
  workMode: string; contractType: string; minYears: number; salaryMin: number | null; salaryMax: number | null;
  skills: string[];
};

export type AreaResult = {
  id: string; name: string; score: number; matchedSkills: string[]; jobsInArea: number;
  bestJobScore: number | null; reason: string; demand: MarketArea["demand"]; nextSkills: string[];
};

export type MatchResult = {
  analyzed: number;
  jobs: { job: MatchJob; score: number; missing: string[] }[];
  areas: AreaResult[];
  skillsToLearn: { name: string; jobs: number }[];
};

/** A habilidade da pessoa conversa com a palavra-chave da área? ("React Native" ~ "react") */
function skillHits(skill: string, keyword: string) {
  const s = normText(skill), k = normText(keyword);
  if (s === k) return true;
  if (k.length < 3 || s.length < 3) return false;
  return s.split(/[\s/,.-]+/).includes(k) || k.split(/[\s/,.-]+/).includes(s) || (k.length >= 5 && s.includes(k));
}

const listPt = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} e ${a[a.length - 1]}`);

export function analyzeProfile(input: CandidateInput, jobs: MatchJob[], limit = 6): MatchResult {
  const scored = jobs.map((job) => {
    const r = computeCompatibility(input, { skills: job.skills, area: job.area, workMode: job.workMode, location: job.location, minYears: job.minYears });
    return { job, score: r.score, missing: r.missingSkills };
  }).sort((a, b) => b.score - a.score || a.missing.length - b.missing.length);

  // para recomendar a área, a área escolhida pela pessoa sai da conta: senão ela sempre venceria
  const neutral: CandidateInput = { ...input, interestArea: null };
  const byArea = new Map<string, number[]>();
  for (const job of jobs) {
    const m = marketAreaOfJobArea(job.area);
    if (!m) continue;
    const s = computeCompatibility(neutral, { skills: job.skills, area: job.area, workMode: job.workMode, location: job.location, minYears: job.minYears }).score;
    byArea.set(m.id, [...(byArea.get(m.id) ?? []), s]);
  }

  const areas: AreaResult[] = MARKET_AREAS.map((a) => {
    const matchedSkills = input.skills.filter((s) => a.keywords.some((k) => skillHits(s, k)));
    const keywordScore = Math.min(1, matchedSkills.length / 3);
    const scores = (byArea.get(a.id) ?? []).sort((x, y) => y - x);
    const best = scores.length ? scores.slice(0, 2).reduce((t, x) => t + x, 0) / Math.min(2, scores.length) : null;
    const score = Math.round((best === null ? keywordScore * 0.85 : 0.55 * (best / 100) + 0.45 * keywordScore) * 100);
    const have = new Set(input.skills.map(normText));
    const nextSkills = a.hardSkills.filter((h) => !have.has(normText(h))).slice(0, 3);
    const parts: string[] = [];
    if (matchedSkills.length) parts.push(`${matchedSkills.length === 1 ? "Sua habilidade" : "Suas habilidades"} ${listPt(matchedSkills.slice(0, 4))} ${matchedSkills.length === 1 ? "é pedida" : "são pedidas"} nessa área.`);
    if (best !== null) parts.push(scores.length === 1 ? `A vaga aberta da área tem ${Math.round(scores[0])}% de compatibilidade com você.`
      : `A mais próxima das ${scores.length} vagas abertas da área tem ${Math.round(scores[0])}% de compatibilidade com você.`);
    const reason = parts.length ? parts.join(" ") : "Poucas habilidades do seu perfil aparecem nessa área por enquanto.";
    return { id: a.id, name: a.name, score, matchedSkills, jobsInArea: scores.length, bestJobScore: best === null ? null : Math.round(scores[0]), reason, demand: a.demand, nextSkills };
  }).sort((x, y) => y.score - x.score || y.jobsInArea - x.jobsInArea);

  // o que mais destravaria vagas: habilidades que faltam nas vagas mais próximas
  const counts = new Map<string, { name: string; jobs: number }>();
  for (const { missing } of scored.slice(0, 10)) {
    for (const m of missing) {
      const k = normText(m);
      const cur = counts.get(k);
      counts.set(k, { name: cur?.name ?? m, jobs: (cur?.jobs ?? 0) + 1 });
    }
  }
  const skillsToLearn = [...counts.values()].sort((a, b) => b.jobs - a.jobs || a.name.localeCompare(b.name)).slice(0, 6);

  return { analyzed: jobs.length, jobs: scored.slice(0, limit), areas: areas.slice(0, 3), skillsToLearn };
}
