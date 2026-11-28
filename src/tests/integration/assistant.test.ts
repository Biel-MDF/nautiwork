import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { db } from "@/lib/db";
import { companiesFor, companyJobsFor, jobDetailsFor, myApplicationsFor, myProfileFor, searchJobsFor, type Viewer } from "@/modules/assistant/data";
import { createAssistantAgent } from "@/modules/assistant/agent";

// Dados próprios, com um termo único para as buscas não esbarrarem no resto do banco.
const tag = `zq${Date.now().toString(36)}`;
const skill = (name: string) => ({ skill: { connectOrCreate: { where: { name }, create: { name } } } });
let cand: Viewer, other: Viewer, compA: Viewer, compB: Viewer;
let activeJob = "", pausedJob = "", otherCompanyPaused = "";

beforeAll(async () => {
  const mk = (role: "CANDIDATE" | "COMPANY", name: string) => db.user.create({ data: { name, email: `${name.replace(/\W/g, "").toLowerCase()}-${tag}@test.local`, role, passwordHash: "x" } });
  const ua = await mk("COMPANY", "Empresa A"), ub = await mk("COMPANY", "Empresa B");
  const ca = await db.companyProfile.create({ data: { userId: ua.id, name: `[Demo] Empresa ${tag} A`, industry: "Tecnologia" } });
  const cb = await db.companyProfile.create({ data: { userId: ub.id, name: `Empresa ${tag} B` } });
  const job = (companyId: string, title: string, status: "ACTIVE" | "PAUSED", skills: string[]) => db.job.create({ data: {
    companyId, title: `${title} ${tag}`, description: "Descrição de teste com detalhes suficientes.", area: "Tecnologia", location: "Recife",
    workMode: "REMOTE", contractType: "CLT", seniority: "JUNIOR", status, skills: { create: skills.map(skill) } } });
  activeJob = (await job(ca.id, "Dev React", "ACTIVE", ["React", "TypeScript"])).id;
  await job(ca.id, "Dev Java", "ACTIVE", ["Java"]);
  pausedJob = (await job(ca.id, "Pausada", "PAUSED", ["React"])).id;
  otherCompanyPaused = (await job(cb.id, "Outra pausada", "PAUSED", [])).id;

  const uc = await db.user.create({ data: { name: "Júlia Teste Sobrenome", email: `julia-${tag}@test.local`, role: "CANDIDATE", passwordHash: "x",
    candidate: { create: { interestArea: "Tecnologia", workMode: "REMOTE", skills: { create: [skill("React"), skill("TypeScript")] } } } }, include: { candidate: true } });
  const uo = await db.user.create({ data: { name: "Outro", email: `outro-${tag}@test.local`, role: "CANDIDATE", passwordHash: "x", candidate: { create: {} } } });
  await db.jobApplication.create({ data: { jobId: activeJob, candidateId: uc.candidate!.id, compatibility: 100 } });

  cand = { id: uc.id, role: "CANDIDATE" }; other = { id: uo.id, role: "CANDIDATE" };
  compA = { id: ua.id, role: "COMPANY" }; compB = { id: ub.id, role: "COMPANY" };
});
afterAll(async () => {
  await db.user.deleteMany({ where: { email: { contains: tag } } });
  await db.$disconnect();
});

describe("dados do assistente", () => {
  it("visitante vê só vagas ativas, sem compatibilidade, e com o nome limpo da empresa", async () => {
    const r = await searchJobsFor(null, { termo: tag });
    expect(r.total).toBe(2);
    expect(r.vagas.map((v) => v.titulo).sort()).toEqual([`Dev Java ${tag}`, `Dev React ${tag}`]);
    expect(r.vagas.every((v) => v.compatibilidade === undefined && v.jaCandidatou === undefined)).toBe(true);
    const react = r.vagas.find((v) => v.id === activeJob)!;
    expect(react).toMatchObject({ empresa: `Empresa ${tag} A`, demonstracao: true, link: `/jobs/${activeJob}`, modalidade: "Remoto" });
  });

  it("candidato recebe a compatibilidade, a ordem por ela e se já se candidatou", async () => {
    const r = await searchJobsFor(cand, { termo: tag, ordenar: "compatibilidade" });
    expect(r.ordenadoPor).toBe("compatibilidade");
    expect(r.vagas[0]).toMatchObject({ id: activeJob, compatibilidade: 100, jaCandidatou: true });
    expect(r.vagas[1].compatibilidade).toBeLessThan(100);
    expect(r.vagas[1].jaCandidatou).toBe(false);
  });

  it("busca com várias palavras exige todas", async () => {
    expect((await searchJobsFor(null, { termo: `react ${tag}` })).total).toBe(1);
    expect((await searchJobsFor(null, { termo: `${tag} inexistentezzz` })).total).toBe(0);
  });

  it("detalhe: vaga pausada só para a própria empresa; candidato vê critérios e o que falta", async () => {
    expect(await jobDetailsFor(null, pausedJob)).toHaveProperty("erro");
    expect(await jobDetailsFor(compB, pausedJob)).toHaveProperty("erro");
    expect(await jobDetailsFor(compA, pausedJob)).toMatchObject({ situacao: "Pausada" });
    expect(await jobDetailsFor(compA, otherCompanyPaused)).toHaveProperty("erro");
    const d = await jobDetailsFor(other, activeJob);
    expect(d).toMatchObject({ minhaCandidatura: "ainda não se candidatou", salva: false });
    const mine = await jobDetailsFor(cand, activeJob);
    expect(mine).toMatchObject({ minhaCandidatura: "Enviada", compatibilidade: { nota: 100, habilidadesQueFaltam: [] } });
  });

  it("perfil e candidaturas ficam no escopo de quem pergunta", async () => {
    expect(await myProfileFor(null)).toHaveProperty("erro");
    expect(await myProfileFor(cand)).toMatchObject({ tipo: "candidato", habilidades: ["React", "TypeScript"], candidaturas: 1 });
    expect(await myProfileFor(compA)).toMatchObject({ tipo: "empresa", nome: `Empresa ${tag} A`, vagas: { Ativa: 2, Pausada: 1 } });
    expect(await myApplicationsFor(null)).toHaveProperty("erro");
    expect(await myApplicationsFor(compA)).toHaveProperty("erro");
    expect((await myApplicationsFor(other)) as { total: number }).toMatchObject({ total: 0 });
    expect(await myApplicationsFor(cand)).toMatchObject({ total: 1, candidaturas: [{ vaga: `Dev React ${tag}`, situacao: "Enviada" }] });
  });

  it("empresa vê só as próprias vagas, com o primeiro nome dos candidatos e nada de e-mail", async () => {
    expect(await companyJobsFor(cand)).toHaveProperty("erro");
    const a = await companyJobsFor(compA) as Awaited<ReturnType<typeof companyJobsFor>> & { vagas: { id: string; candidaturas: number; maisCompativeis: unknown[] }[] };
    expect(a.vagas).toHaveLength(3);
    const react = a.vagas.find((v) => v.id === activeJob)!;
    expect(react).toMatchObject({ candidaturas: 1, maisCompativeis: [{ candidato: "Júlia", compatibilidade: 100 }] });
    expect(JSON.stringify(a)).not.toMatch(/@test\.local|Sobrenome/);
    const b = await companyJobsFor(compB) as { vagas: { id: string }[] };
    expect(b.vagas.map((v) => v.id)).toEqual([otherCompanyPaused]);
  });

  it("lista empresas com contagem de vagas abertas", async () => {
    const r = await companiesFor(tag);
    expect(r.empresas.map((e) => [e.nome, e.vagasAbertas])).toEqual([[`Empresa ${tag} A`, 2], [`Empresa ${tag} B`, 0]]);
  });
});

describe("agente", () => {
  const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } };
  /** Modelo que pede uma ferramenta na primeira volta e responde texto na segunda. */
  function scripted(toolName: string, input: object) {
    return new MockLanguageModelV4({
      doStream: async ({ prompt }) => ({
        stream: simulateReadableStream<LanguageModelV4StreamPart>({ chunks: prompt.at(-1)?.role === "tool"
          ? [{ type: "text-start", id: "t" }, { type: "text-delta", id: "t", delta: "ok" }, { type: "text-end", id: "t" }, { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage }]
          : [{ type: "tool-call", toolCallId: "c1", toolName, input: JSON.stringify(input) }, { type: "finish", finishReason: { unified: "tool-calls", raw: undefined }, usage }] }),
      }),
    });
  }

  it("executa as ferramentas no escopo da pessoa e envia só as ferramentas do perfil", async () => {
    const model = scripted("minhas_candidaturas", {});
    const res = await createAssistantAgent({ viewer: cand, name: "Júlia Teste", model }).stream({ prompt: "minhas candidaturas" });
    await res.consumeStream();
    const results = (await res.steps).flatMap((s) => s.toolResults);
    expect(results[0]?.output).toMatchObject({ total: 1 });
    const offered = (model.doStreamCalls[0].tools ?? []).map((t) => t.name).sort();
    expect(offered).toEqual(["buscar_vagas", "listar_empresas", "meu_curriculo", "meu_perfil", "minhas_candidaturas", "ver_vaga"]);
    expect(String(JSON.stringify(model.doStreamCalls[0].prompt))).toContain("CANDIDATO");
  });

  it("visitante não tem acesso a ferramentas de conta, mesmo se o modelo tentar", async () => {
    const model = scripted("vagas_da_empresa", {});
    const res = await createAssistantAgent({ viewer: null, model }).stream({ prompt: "x" });
    await res.consumeStream();
    const steps = await res.steps;
    expect(steps.flatMap((s) => s.toolResults)).toHaveLength(0);
    expect((model.doStreamCalls[0].tools ?? []).map((t) => t.name)).not.toContain("vagas_da_empresa");
  });
});
