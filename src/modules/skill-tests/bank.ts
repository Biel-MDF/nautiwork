// Banco de questões das provas de habilidade. Cada prova sorteia 5 questões da habilidade;
// passa quem acerta 4 (80%). As respostas certas ficam só no servidor.
// Para incluir uma habilidade: um item novo, com pelo menos 6 questões e os apelidos usados nos perfis.

import { normText } from "../market/areas";

export type Question = { id: string; prompt: string; options: string[]; answer: number };
export type SkillTest = { slug: string; name: string; aliases: string[]; questions: Question[] };

export const QUESTIONS_PER_TEST = 5;
export const PASS_SCORE = 4;
export const TIME_LIMIT_MIN = 10;
export const RETRY_DAYS = 7;

const q = (id: string, prompt: string, options: string[], answer = 0): Question => ({ id, prompt, options, answer });

export const SKILL_TESTS: SkillTest[] = [
  {
    slug: "excel", name: "Excel", aliases: ["excel", "planilhas", "planilha", "microsoft excel"],
    questions: [
      q("excel-1", "Qual fórmula soma os valores das células A1 até A10?", ["=SOMA(A1:A10)", "=SOMA(A1;A10)", "=TOTAL(A1-A10)", "=SOMAR(A1:A10)"]),
      q("excel-2", "Na fórmula =B2*$C$1, o que os cifrões ($) fazem?", ["Fixam a referência a C1 quando a fórmula é copiada", "Formatam o resultado como moeda", "Deixam o valor negativo", "Arredondam o resultado"]),
      q("excel-3", "Qual função calcula a média de um intervalo?", ["MÉDIA", "MÁXIMO", "CONT.VALORES", "SOMA"]),
      q("excel-4", "Com A1 = 6,5, qual o resultado de =SE(A1>=7;\"Aprovado\";\"Reprovado\")?", ["Reprovado", "Aprovado", "6,5", "Um erro"]),
      q("excel-5", "Qual função procura um valor na primeira coluna de uma tabela e devolve outro valor da mesma linha?", ["PROCV", "CONT.SE", "CONCATENAR", "HOJE"]),
      q("excel-6", "Qual recurso resume muitas linhas por categoria sem escrever fórmulas?", ["Tabela dinâmica", "Mesclar células", "Congelar painéis", "Formatação condicional"]),
    ],
  },
  {
    slug: "logica", name: "Lógica de programação", aliases: ["logica de programacao", "logica", "algoritmos", "programacao"],
    questions: [
      q("logica-1", "Começando com x = 0, o laço \"enquanto x < 5, faça x = x + 2\" termina com x igual a:", ["6", "5", "4", "8"]),
      q("logica-2", "Qual o resultado de (verdadeiro E falso) OU verdadeiro?", ["Verdadeiro", "Falso", "Indefinido", "Erro"]),
      q("logica-3", "Como saber se um número inteiro é par?", ["O resto da divisão por 2 é zero", "Ele é maior que 2", "Ele termina em 1", "A divisão por 3 é exata"]),
      q("logica-4", "No vetor [3, 8, 1], contando a partir de zero, qual a posição do valor 8?", ["1", "2", "0", "8"]),
      q("logica-5", "Qual estrutura repete um bloco um número conhecido de vezes?", ["para (for)", "se (if)", "senão (else)", "retorne (return)"]),
      q("logica-6", "Qual sequência troca corretamente os valores de A e B?", ["aux = A; A = B; B = aux", "A = B; B = A", "B = A; A = B", "A = A; B = B"]),
    ],
  },
  {
    slug: "javascript", name: "JavaScript", aliases: ["javascript", "js", "ecmascript"],
    questions: [
      q("js-1", "Qual o resultado de typeof [] em JavaScript?", ["\"object\"", "\"array\"", "\"list\"", "\"undefined\""]),
      q("js-2", "Qual a diferença entre === e ==?", ["=== compara valor e tipo, sem converter", "=== só compara textos", "Não há diferença", "=== atribui um valor"]),
      q("js-3", "Qual palavra declara uma variável que não pode receber outro valor?", ["const", "let", "var", "static"]),
      q("js-4", "O que [1, 2, 3].map(n => n * 2) devolve?", ["[2, 4, 6]", "12", "[1, 2, 3, 2]", "6"]),
      q("js-5", "O que JSON.parse faz?", ["Transforma um texto JSON em objeto", "Transforma um objeto em texto JSON", "Valida um HTML", "Faz uma requisição"]),
      q("js-6", "Qual o resultado de \"5\" + 2?", ["\"52\"", "7", "NaN", "Um erro"]),
    ],
  },
  {
    slug: "sql", name: "SQL", aliases: ["sql", "banco de dados", "postgresql", "mysql"],
    questions: [
      q("sql-1", "Qual comando consulta dados de uma tabela?", ["SELECT", "INSERT", "UPDATE", "DROP"]),
      q("sql-2", "Qual cláusula filtra as linhas de uma consulta?", ["WHERE", "ORDER BY", "GROUP BY", "FROM"]),
      q("sql-3", "O que COUNT(*) devolve?", ["O número de linhas", "A soma dos valores", "O maior valor", "O número de colunas"]),
      q("sql-4", "Como juntar as tabelas pedidos e clientes pelo código do cliente?", ["Com JOIN", "Com UNION", "Com ALTER", "Com INDEX"]),
      q("sql-5", "O que acontece com um UPDATE sem WHERE?", ["Altera todas as linhas da tabela", "Não altera nenhuma linha", "Altera só a primeira linha", "Sempre dá erro"]),
      q("sql-6", "Como ordenar do maior para o menor salário?", ["ORDER BY salario DESC", "ORDER BY salario ASC", "GROUP BY salario", "SORT salario DOWN"]),
    ],
  },
  {
    slug: "git", name: "Git", aliases: ["git", "github", "controle de versao"],
    questions: [
      q("git-1", "Qual comando registra as mudanças preparadas em um novo commit?", ["git commit", "git add", "git push", "git clone"]),
      q("git-2", "Para que serve git add?", ["Preparar alterações para o próximo commit", "Enviar commits ao GitHub", "Criar um repositório", "Apagar arquivos"]),
      q("git-3", "O que git push faz?", ["Envia os commits locais para o repositório remoto", "Baixa as mudanças do remoto", "Desfaz o último commit", "Cria uma branch"]),
      q("git-4", "Qual comando cria uma branch nova e já muda para ela?", ["git switch -c nome", "git branch -d nome", "git merge nome", "git init nome"]),
      q("git-5", "O que git status mostra?", ["Arquivos alterados, preparados e não rastreados", "Só o histórico de commits", "Os usuários do repositório", "A velocidade da internet"]),
      q("git-6", "Quando acontece um conflito de merge?", ["Quando duas branches mudam as mesmas linhas de formas diferentes", "Quando o repositório é privado", "Quando falta internet", "Quando a mensagem do commit é longa"]),
    ],
  },
  {
    slug: "html-css", name: "HTML e CSS", aliases: ["html", "css", "html e css", "html5", "css3"],
    questions: [
      q("web-1", "Qual tag cria um link clicável para outra página?", ["<a>", "<link>", "<href>", "<url>"]),
      q("web-2", "Qual atributo descreve uma imagem para quem usa leitor de tela?", ["alt", "title", "src", "name"]),
      q("web-3", "Em CSS, como selecionar elementos com class=\"botao\"?", [".botao", "#botao", "botao", "*botao"]),
      q("web-4", "Para que serve display: flex?", ["Organizar os filhos em linha ou coluna", "Esconder o elemento", "Animar o elemento", "Mudar a fonte"]),
      q("web-5", "Qual unidade é relativa ao tamanho da fonte do elemento raiz (html)?", ["rem", "px", "vh", "%"]),
      q("web-6", "Quando valem os estilos dentro de @media (max-width: 600px)?", ["Em telas com até 600px de largura", "Só na impressão", "Em telas com mais de 600px", "Sempre"]),
    ],
  },
  {
    slug: "python", name: "Python", aliases: ["python", "python3"],
    questions: [
      q("py-1", "O que print(len(\"casa\")) mostra?", ["4", "3", "5", "casa"]),
      q("py-2", "Qual destes é uma lista em Python?", ["[1, 2, 3]", "(1, 2, 3)", "{1, 2, 3}", "\"1, 2, 3\""]),
      q("py-3", "Em Python, como se sabe que um bloco pertence a um if?", ["Pela indentação", "Pelas chaves { }", "Pelo ponto e vírgula", "Pela palavra end"]),
      q("py-4", "Quais números range(3) gera?", ["0, 1, 2", "1, 2, 3", "0, 1, 2, 3", "Só o 3"]),
      q("py-5", "Qual o resultado de 7 // 2?", ["3", "3.5", "4", "1"]),
      q("py-6", "Qual estrutura trata um erro sem parar o programa?", ["try / except", "if / else", "for / while", "def / return"]),
    ],
  },
  {
    slug: "atendimento", name: "Atendimento ao cliente", aliases: ["atendimento", "atendimento ao cliente", "comunicacao", "relacionamento com cliente"],
    questions: [
      q("at-1", "Um cliente irritado reclama de um atraso. Qual o primeiro passo?", ["Ouvir sem interromper e reconhecer o problema", "Explicar que a culpa não é sua", "Transferir a ligação na hora", "Pedir que ele volte outro dia"]),
      q("at-2", "Você não sabe a resposta para a pergunta do cliente. O que fazer?", ["Dizer que vai verificar e dar retorno no prazo combinado", "Inventar uma resposta", "Dizer que não é do seu setor e encerrar", "Mudar de assunto"]),
      q("at-3", "Qual linguagem é adequada no atendimento?", ["Clara e educada, sem gírias nem termos técnicos desnecessários", "Cheia de termos técnicos, para passar confiança", "Informal, com gírias, para criar intimidade", "A mais curta possível, mesmo que pareça seca"]),
      q("at-4", "O que fazer com os dados pessoais do cliente?", ["Usar só para o atendimento e não compartilhar com quem não precisa", "Anotar em um papel e deixar na mesa", "Enviar para colegas por mensagem pessoal", "Publicar no grupo da equipe"]),
      q("at-5", "Como encerrar bem um atendimento?", ["Confirmar se o problema foi resolvido e se há algo mais", "Encerrar assim que possível", "Prometer um desconto sem autorização", "Pedir nota máxima na avaliação"]),
      q("at-6", "Sobre promessas ao cliente, o certo é:", ["Prometer só o que a empresa pode cumprir", "Prometer tudo para acalmar", "Nunca dar prazo nenhum", "Prometer o que o cliente pedir"]),
    ],
  },
];


export function testForSkill(name: string) {
  const n = normText(name);
  return SKILL_TESTS.find((t) => t.slug === n || t.aliases.includes(n) || normText(t.name) === n);
}

export function testBySlug(slug: string) {
  return SKILL_TESTS.find((t) => t.slug === slug);
}

/** Sorteia as questões e embaralha as alternativas guardando a ordem (o servidor confere pela ordem salva). */
export function drawQuestions(test: SkillTest, rnd: () => number = Math.random) {
  const pool = [...test.questions];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, QUESTIONS_PER_TEST).map((qq) => {
    const order = qq.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return { id: `${qq.id}:${order.join("")}`, prompt: qq.prompt, options: order.map((i) => qq.options[i]) };
  });
}

/** Remonta as questões já sorteadas (para retomar uma prova em andamento depois de recarregar a página). */
export function questionsFromIds(test: SkillTest, ids: string[]) {
  return ids.map((sid) => {
    const [qid, order] = sid.split(":");
    const qq = test.questions.find((x) => x.id === qid)!;
    return { id: sid, prompt: qq.prompt, options: [...order].map((i) => qq.options[Number(i)]) };
  });
}

/** Corrige: cada id guarda a ordem embaralhada; a resposta é a posição escolhida na tela. */
export function grade(test: SkillTest, servedIds: string[], answers: number[]) {
  let score = 0;
  servedIds.forEach((sid, i) => {
    const [qid, order] = sid.split(":");
    const qq = test.questions.find((x) => x.id === qid);
    const picked = answers[i];
    if (!qq || !order || typeof picked !== "number") return;
    if (Number(order[picked]) === qq.answer) score++;
  });
  return { score, total: servedIds.length, passed: score >= PASS_SCORE };
}
