// Cursos gratuitos sugeridos quando falta uma habilidade (na recusa com motivo e no perfil).
// São portais de cursos livres e gratuitos; o link leva ao catálogo, onde a pessoa busca o tema.
import { normText } from "./market/areas";

export type Course = { provider: string; url: string; hint: string };

const PROVIDERS = {
  cev: { provider: "Curso em Vídeo", url: "https://www.cursoemvideo.com/", hint: "cursos gratuitos de programação com certificado" },
  fcc: { provider: "freeCodeCamp", url: "https://www.freecodecamp.org/portuguese/learn", hint: "trilhas gratuitas de desenvolvimento web" },
  ms: { provider: "Microsoft Learn", url: "https://learn.microsoft.com/pt-br/training/", hint: "trilhas gratuitas de Excel, Power BI, nuvem e dados" },
  ev: { provider: "Escola Virtual da Fundação Bradesco", url: "https://www.ev.org.br/", hint: "cursos gratuitos de informática, gestão e comportamento" },
  evg: { provider: "Escola Virtual de Governo (Enap)", url: "https://www.escolavirtual.gov.br/", hint: "cursos gratuitos com certificado em várias áreas" },
  khan: { provider: "Khan Academy", url: "https://pt.khanacademy.org/", hint: "matemática, lógica e introdução à programação" },
} as const;

const RULES: [RegExp, (keyof typeof PROVIDERS)[]][] = [
  [/javascript|typescript|react|next|node|html|css|front|back|web/, ["cev", "fcc"]],
  [/python|java\b|c#|programa|logica|algoritmo|git/, ["cev", "khan"]],
  [/sql|dados|power ?bi|excel|planilha|estatistic/, ["ms", "ev"]],
  [/comunica|atendimento|vendas|negocia|lideranca|equipe|organiza|gestao|administra/, ["ev", "evg"]],
  [/ingles|english|espanhol/, ["evg", "ev"]],
];

export function coursesFor(skill: string): Course[] {
  const s = normText(skill);
  const rule = RULES.find(([re]) => re.test(s));
  return (rule ? rule[1] : (["ev", "evg"] as const)).map((k) => PROVIDERS[k]);
}

export const REJECT_REASONS = {
  SKILLS: "Faltaram habilidades pedidas na vaga",
  EXPERIENCE: "A experiência ficou abaixo do que a vaga pede",
  PROFILE: "O perfil é diferente do que a vaga precisa agora",
  LOCATION: "Localização ou disponibilidade de horário",
  FILLED: "A vaga foi preenchida por outra pessoa",
  CONDITIONS: "Condições (salário, modalidade) não combinaram",
  OTHER: "Outro motivo",
} as const;
export type RejectReason = keyof typeof REJECT_REASONS;
