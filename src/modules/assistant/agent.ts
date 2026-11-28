// O agente do assistente: modelo, instruções e ferramentas (todas só de leitura).
// É criado a cada requisição, com as ferramentas presas a quem está conversando.
import { ToolLoopAgent, isStepCount, tool, type InferAgentUIMessage, type LanguageModel } from "ai";
import { z } from "zod";
import { applicantsFor, companiesFor, companyJobsFor, jobDetailsFor, myApplicationsFor, myProfileFor, resumeFor, searchJobsFor, type Viewer } from "./data";
import { assistantInstructions, type AssistantMode } from "./prompt";

/**
 * Modelo padrão pela Vercel AI Gateway: gratuito (custo zero por token). Para usar o Claude,
 * defina AI_GATEWAY_MODEL=anthropic/claude-haiku-5.5 (ou outro) no ambiente; exige créditos pagos.
 * Se o primeiro estiver fora do ar, a Gateway tenta os outros, também gratuitos.
 */
export const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-free";
export const FALLBACK_MODELS = ["reflection/beam-free"];
// modelos que "pensam" antes de responder gastam parte do limite com o raciocínio
export const MAX_OUTPUT_TOKENS = 2000;

export function assistantModel() {
  return process.env.AI_GATEWAY_MODEL?.trim() || DEFAULT_MODEL;
}

const searchInput = z.object({
  termo: z.string().trim().max(100).optional().describe("Palavras para buscar no título, descrição, área, empresa e habilidades. Ex.: 'react', 'atendimento'"),
  area: z.string().trim().max(80).optional().describe("Área da vaga. Ex.: Tecnologia, Marketing, Administração"),
  cidade: z.string().trim().max(80).optional(),
  modalidade: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional().describe("ONSITE presencial, HYBRID híbrido, REMOTE remoto"),
  contrato: z.enum(["CLT", "PJ", "INTERNSHIP", "TEMPORARY"]).optional().describe("INTERNSHIP = estágio"),
  senioridade: z.enum(["INTERN", "JUNIOR", "MID", "SENIOR", "LEAD"]).optional().describe("INTERN estagiário, JUNIOR, MID pleno, SENIOR, LEAD liderança"),
  semExperiencia: z.boolean().optional().describe("true = só vagas que não exigem experiência"),
  salarioMinimo: z.number().int().positive().max(1_000_000).optional().describe("Salário mensal mínimo desejado, em reais"),
  publicadasNosUltimosDias: z.number().int().positive().max(365).optional(),
  ordenar: z.enum(["recentes", "compatibilidade"]).optional().describe("'compatibilidade' só faz efeito para candidato logado"),
  limite: z.number().int().min(1).max(8).optional().describe("Quantas vagas trazer (padrão 6)"),
});

export function createAssistantTools(viewer: Viewer) {
  return {
    buscar_vagas: tool({
      description: "Busca vagas ativas no Nautiwork. Para candidato, cada vaga vem com a compatibilidade e se já se candidatou.",
      inputSchema: searchInput,
      execute: (input) => searchJobsFor(viewer, input),
    }),
    ver_vaga: tool({
      description: "Detalhes de uma vaga pelo id (o id vem de buscar_vagas ou do link /jobs/<id>). Para candidato, traz a compatibilidade critério a critério e as habilidades que faltam.",
      inputSchema: z.object({ id: z.string().trim().min(1).max(40) }),
      execute: ({ id }) => jobDetailsFor(viewer, id),
    }),
    listar_empresas: tool({
      description: "Lista empresas do Nautiwork com setor, cidade e quantas vagas abertas têm. Filtro opcional por nome, setor ou cidade.",
      inputSchema: z.object({ termo: z.string().trim().max(80).optional() }),
      execute: ({ termo }) => companiesFor(termo),
    }),
    meu_perfil: tool({
      description: "Resumo do perfil de quem está logado (candidato ou empresa) e o que falta preencher.",
      inputSchema: z.object({}),
      execute: () => myProfileFor(viewer),
    }),
    minhas_candidaturas: tool({
      description: "Candidaturas do candidato logado, com a situação de cada uma.",
      inputSchema: z.object({}),
      execute: () => myApplicationsFor(viewer),
    }),
    meu_curriculo: tool({
      description: "Currículo completo do candidato logado (título, sobre, habilidades, experiências, formação e projetos), para revisar e sugerir melhorias.",
      inputSchema: z.object({}),
      execute: () => resumeFor(viewer),
    }),
    candidatos_da_vaga: tool({
      description: "Candidatos de uma vaga da empresa logada, ordenados pela compatibilidade, com habilidades, experiência e projetos. Use o id que vagas_da_empresa devolve.",
      inputSchema: z.object({ vagaId: z.string().trim().min(1).max(40) }),
      execute: ({ vagaId }) => applicantsFor(viewer, vagaId),
    }),
    vagas_da_empresa: tool({
      description: "Vagas da empresa logada, com quantas candidaturas cada uma recebeu, por situação, e as mais compatíveis.",
      inputSchema: z.object({}),
      execute: () => companyJobsFor(viewer),
    }),
  };
}

type ToolName = keyof ReturnType<typeof createAssistantTools>;

/** Ferramentas que fazem sentido para cada perfil. */
export function toolsFor(viewer: Viewer): ToolName[] {
  const common: ToolName[] = ["buscar_vagas", "ver_vaga", "listar_empresas"];
  if (viewer?.role === "CANDIDATE") return [...common, "meu_perfil", "minhas_candidaturas", "meu_curriculo"];
  if (viewer?.role === "COMPANY") return [...common, "meu_perfil", "vagas_da_empresa", "candidatos_da_vaga"];
  return common;
}

export function createAssistantAgent(opts: { viewer: Viewer; name?: string | null; model?: LanguageModel; userTag?: string; mode?: AssistantMode; jobId?: string }) {
  const { viewer } = opts;
  return new ToolLoopAgent({
    model: opts.model ?? assistantModel(),
    instructions: assistantInstructions(viewer, opts.name, new Date(), opts.mode ?? "carreira", opts.jobId),
    tools: createAssistantTools(viewer),
    activeTools: toolsFor(viewer),
    // poucas voltas bastam (buscar, detalhar, responder) e limitam o custo de cada pergunta
    stopWhen: isStepCount(6),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    providerOptions: {
      gateway: {
        models: process.env.AI_GATEWAY_MODEL?.trim() ? [] : FALLBACK_MODELS,
        tags: ["nautiwork-assistente", `perfil:${viewer?.role ?? "VISITOR"}`, `modo:${opts.mode ?? "carreira"}`],
        ...(opts.userTag ? { user: opts.userTag } : {}),
      },
    },
  });
}

export type AssistantAgent = ReturnType<typeof createAssistantAgent>;
export type AssistantUIMessage = InferAgentUIMessage<AssistantAgent>;
