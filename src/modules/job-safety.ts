// Conferências feitas ao publicar ou editar uma vaga, antes de ela ir ao ar.
// 1. Antigolpe: vaga que pede dinheiro ou dados sensíveis é recusada; sinais fracos
//    (contato só por telefone, "renda extra") mandam a vaga para a moderação.
// 2. Vaga de iniciante sem pegadinha: "júnior", "estágio" ou "sem experiência" não podem
//    pedir anos de experiência no texto.
// 3. Jovem Aprendiz: contrato CLT de aprendizagem, sem exigência de experiência.

export type JobText = {
  title: string; description: string; responsibilities?: string | null; requirements?: string | null; benefits?: string | null;
  seniority: string; contractType: string; minYears: number; forApprentice?: boolean;
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Pedidos que um processo seletivo honesto nunca faz. Cada um recusa a vaga. */
const BLOCK: [RegExp, string][] = [
  [/\bpix\b/, "pede pagamento por Pix"],
  [/\btaxa\s+(de\s+)?(inscricao|cadastro|adesao|matricula|administrativa|de\s+material)/, "cobra taxa do candidato"],
  [/\b(pagamento|deposito|transferencia)\s+(antecipad|previ|inicial)/, "pede pagamento antecipado"],
  [/\b(pague|pagar|deposite|depositar|transferir)\b[^.]{0,40}\b(para\s+)?(participar|garantir|reservar|liberar)\b/, "pede dinheiro para participar"],
  [/\bcurso\s+(pago|obrigatorio\s+pago)|\bcompr(e|ar)\s+(o\s+)?(kit|material|curso|uniforme)/, "exige comprar curso, kit ou material"],
  [/\b(dados|conta|informacoes)\s+bancari|\bsenha\s+(do|de)\s+(banco|cartao|app)|\bnumero\s+do\s+cartao/, "pede dados bancários ou senhas"],
  [/\binvestimento\s+inicial|\binvestir\s+(um\s+)?valor/, "pede investimento do candidato"],
  [/\bexame\s+medico\s+pago\s+pelo\s+candidato|\bpagar\s+(o\s+)?exame/, "cobra exame médico do candidato"],
];

/** Sinais comuns em golpes, mas que também aparecem em vagas reais: vão para a moderação. */
const WARN: [RegExp, string][] = [
  [/\b(renda|ganho)\s+extra\b/, "promete renda extra"],
  [/\bganhe\s+(ate\s+)?r\$\s?\d/, "promete ganhos"],
  [/\b(chame|chamar|fale|falar|contato)\b[^.]{0,30}\b(whats(app)?|zap|telegram)\b/, "pede contato fora do site"],
  [/\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/, "traz número de telefone"],
  [/\bsem\s+(processo\s+seletivo|entrevista)\b/, "diz que não há processo seletivo"],
];

export function scanJobText(job: JobText) {
  const text = norm([job.title, job.description, job.responsibilities, job.requirements, job.benefits].filter(Boolean).join(" \n "));
  return {
    block: BLOCK.filter(([re]) => re.test(text)).map(([, why]) => why),
    warn: WARN.filter(([re]) => re.test(text)).map(([, why]) => why),
  };
}

/** Maior número de anos de experiência pedido no texto ("2 anos de experiência", "experiência de 3 anos"). */
export function yearsAskedInText(text: string) {
  const t = norm(text);
  const nums: number[] = [];
  const words: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6 };
  const n = String.raw`(\d{1,2}|um|uma|dois|duas|tres|quatro|cinco|seis)`;
  for (const re of [
    new RegExp(String.raw`${n}\s*\+?\s*anos?\s+(de\s+|em\s+)?(experiencia|atuacao|vivencia)`, "g"),
    new RegExp(String.raw`(experiencia|atuacao|vivencia)[^.\n]{0,30}?(minima\s+)?de\s+${n}\s+anos?`, "g"),
  ]) {
    for (const m of t.matchAll(re)) {
      const raw = m[1].match(/^\d/) || words[m[1]] !== undefined ? m[1] : m[m.length - 1];
      const v = Number(raw) || words[raw] || 0;
      if (v > 0) nums.push(v);
    }
  }
  return nums.length ? Math.max(...nums) : 0;
}

/** Erros de coerência que impedem publicar, por campo (mesmo formato do Zod). */
export function coherenceErrors(job: JobText): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const add = (k: string, m: string) => { (errors[k] ??= []).push(m); };
  const entry = job.seniority === "INTERN" || job.contractType === "INTERNSHIP" || job.forApprentice;
  if (entry && job.minYears > 0) add("minYears", "Estágio e Jovem Aprendiz são para quem está começando: deixe 0 ano de experiência.");
  const asked = yearsAskedInText([job.description, job.responsibilities, job.requirements].filter(Boolean).join(" "));
  if (asked > job.minYears) {
    const label = job.minYears === 0 ? "como vaga sem experiência" : `com ${job.minYears} ${job.minYears === 1 ? "ano" : "anos"} de experiência`;
    add("requirements", `O texto pede ${asked} ${asked === 1 ? "ano" : "anos"} de experiência, mas a vaga está marcada ${label}. Ajuste o campo de anos mínimos ou o texto.`);
  }
  if (job.forApprentice && job.contractType !== "CLT")
    add("contractType", "Jovem Aprendiz é contratado com carteira assinada (contrato de aprendizagem): escolha CLT.");
  return errors;
}
