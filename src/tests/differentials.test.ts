import { describe, expect, it } from "vitest";
import { coherenceErrors, scanJobText, yearsAskedInText } from "@/modules/job-safety";
import { estimateQuotas, pcdRate } from "@/modules/quotas";
import { formatCnpj, isValidCnpj, lookupCnpj } from "@/modules/cnpj";
import { commuteFor, geocodeCep, haversineKm, kmForMinutes, transitMinutes } from "@/modules/geo";
import { SKILL_TESTS, drawQuestions, grade, questionsFromIds, testForSkill, QUESTIONS_PER_TEST } from "@/modules/skill-tests/bank";
import { REJECT_REASONS, coursesFor } from "@/modules/courses";
import { checkinSchema, contactSchema, jobSchema, projectSchema, statusSchema } from "@/lib/validators";

const job = (over: Partial<Parameters<typeof scanJobText>[0]> = {}) => ({
  title: "Atendente", description: "Atender clientes na loja e organizar o estoque.", seniority: "JUNIOR", contractType: "CLT", minYears: 0, ...over,
});

describe("antigolpe", () => {
  it("barra vaga que pede dinheiro", () => {
    expect(scanJobText(job({ description: "Para participar, faça um Pix de R$ 50 de taxa de inscrição." })).block.length).toBeGreaterThan(0);
    expect(scanJobText(job({ requirements: "Comprar o kit de uniforme no primeiro dia." })).block).toContain("exige comprar curso, kit ou material");
    expect(scanJobText(job({ description: "Informe seus dados bancários e a senha do app." })).block).toContain("pede dados bancários ou senhas");
  });
  it("manda para a moderação sinais fracos", () => {
    const r = scanJobText(job({ description: "Renda extra garantida! Chame no WhatsApp (11) 91234-5678." }));
    expect(r.block).toEqual([]);
    expect(r.warn).toEqual(expect.arrayContaining(["promete renda extra", "pede contato fora do site", "traz número de telefone"]));
  });
  it("não acusa vaga normal", () => {
    expect(scanJobText(job())).toEqual({ block: [], warn: [] });
    expect(scanJobText(job({ benefits: "Vale-transporte e plano de saúde" }))).toEqual({ block: [], warn: [] });
  });
});

describe("vaga de iniciante sem pegadinha", () => {
  it("acha anos pedidos no texto", () => {
    expect(yearsAskedInText("Experiência de 2 anos com vendas")).toBe(2);
    expect(yearsAskedInText("Pelo menos três anos de experiência")).toBe(3);
    expect(yearsAskedInText("Vaga sem experiência")).toBe(0);
  });
  it("estágio e aprendiz não pedem experiência", () => {
    expect(coherenceErrors(job({ contractType: "INTERNSHIP", minYears: 1 })).minYears).toBeDefined();
    expect(coherenceErrors(job({ forApprentice: true, minYears: 0, contractType: "PJ" })).contractType).toBeDefined();
  });
  it("texto não pode pedir mais anos que o campo", () => {
    expect(coherenceErrors(job({ requirements: "2 anos de experiência" })).requirements?.[0]).toMatch(/2 anos/);
    expect(coherenceErrors(job({ requirements: "2 anos de experiência", minYears: 2 }))).toEqual({});
  });
});

describe("cotas", () => {
  it("faixas da cota PcD", () => {
    expect([99, 100, 200, 201, 500, 501, 1000, 1001].map(pcdRate)).toEqual([0, 0.02, 0.02, 0.03, 0.03, 0.04, 0.04, 0.05]);
  });
  it("aprendiz: 5% a 15%, arredondando a fração para cima no mínimo", () => {
    const q = estimateQuotas({ employees: 150, size: "MEDIUM", apprentices: 3, pcdEmployees: 1 });
    expect(q.apprentice).toMatchObject({ required: true, min: 8, max: 22, missing: 5 });
    expect(q.pcd).toMatchObject({ required: true, min: 3, missing: 2 });
  });
  it("micro e pequena empresa não têm cota de aprendiz", () => {
    expect(estimateQuotas({ employees: 40, size: "EPP" }).apprentice.required).toBe(false);
    expect(estimateQuotas({ employees: 5, size: "MEDIUM" }).apprentice.required).toBe(false);
  });
});

describe("CNPJ", () => {
  it("confere os dígitos", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000182")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
  it("lê a situação na BrasilAPI", async () => {
    const ok = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
    expect(await lookupCnpj("11222333000181", ok({ razao_social: "ACME LTDA", descricao_situacao_cadastral: "ATIVA" }))).toEqual({ ok: true, legalName: "ACME LTDA", active: true, status: "ATIVA" });
    expect((await lookupCnpj("11222333000181", ok({ razao_social: "X", descricao_situacao_cadastral: "BAIXADA" })) as { active: boolean }).active).toBe(false);
    expect(await lookupCnpj("11222333000181", ok({}, 404))).toEqual({ ok: false, reason: "not_found" });
    expect(await lookupCnpj("11222333000181", (async () => { throw new Error("rede"); }) as unknown as typeof fetch)).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("deslocamento", () => {
  const sp = { lat: -23.5505, lng: -46.6333 };
  it("distância e minutos", () => {
    expect(Math.round(haversineKm(sp, { lat: -23.9608, lng: -46.3336 }))).toBe(55);
    expect(transitMinutes(0)).toBe(10);
    expect(transitMinutes(kmForMinutes(60))).toBe(60);
  });
  it("remoto e sem coordenadas não têm estimativa", () => {
    expect(commuteFor(sp, { ...sp, workMode: "REMOTE" })).toBeNull();
    expect(commuteFor(null, { ...sp, workMode: "ONSITE" })).toBeNull();
    expect(commuteFor(sp, { lat: null, lng: null, workMode: "ONSITE" })).toBeNull();
  });
  it("longe demais não vira minutos", () => {
    expect(commuteFor(sp, { lat: -8.0476, lng: -34.877, workMode: "ONSITE" })?.minutes).toBeNull();
  });
  it("CEP: usa coordenadas da BrasilAPI e cai no OpenStreetMap", async () => {
    const calls: string[] = [];
    const f = (async (url: string) => {
      calls.push(url);
      if (url.includes("brasilapi")) return new Response(JSON.stringify({ street: "Av. Paulista", city: "São Paulo", state: "SP" }));
      return new Response(JSON.stringify([{ lat: "-23.56", lon: "-46.65" }]));
    }) as unknown as typeof fetch;
    expect(await geocodeCep("01310-100", f)).toMatchObject({ lat: -23.56, lng: -46.65 });
    expect(calls[1]).toContain("nominatim");
    expect(await geocodeCep("123", f)).toBeNull();
  });
});

describe("provas de habilidade", () => {
  it("todo teste tem questões suficientes e respostas válidas", () => {
    for (const t of SKILL_TESTS) {
      expect(t.questions.length).toBeGreaterThanOrEqual(QUESTIONS_PER_TEST);
      for (const q of t.questions) { expect(q.options).toHaveLength(4); expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(4); }
      expect(new Set(t.questions.map((q) => q.id)).size).toBe(t.questions.length);
    }
  });
  it("corrige pela ordem embaralhada", () => {
    const t = testForSkill("Planilhas")!;
    expect(t.slug).toBe("excel");
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const qs = drawQuestions(t, rnd);
    const right = qs.map((q) => { const orig = t.questions.find((x) => x.id === q.id.split(":")[0])!; return q.options.indexOf(orig.options[orig.answer]); });
    expect(grade(t, qs.map((q) => q.id), right)).toEqual({ score: 5, total: 5, passed: true });
    expect(grade(t, qs.map((q) => q.id), right.map((r) => (r + 1) % 4)).score).toBe(0);
    expect(questionsFromIds(t, qs.map((q) => q.id))).toEqual(qs);
  });
});

describe("recusa com motivo e cursos", () => {
  it("motivo é obrigatório ao recusar", () => {
    expect(statusSchema.safeParse({ status: "REJECTED" }).success).toBe(false);
    expect(statusSchema.safeParse({ status: "REJECTED", reason: "SKILLS", missingSkills: ["SQL"] }).success).toBe(true);
    expect(statusSchema.safeParse({ status: "INTERVIEW" }).success).toBe(true);
    expect(Object.keys(REJECT_REASONS)).toContain("FILLED");
  });
  it("sugere cursos gratuitos pela habilidade", () => {
    expect(coursesFor("SQL").map((c) => c.provider)).toContain("Microsoft Learn");
    expect(coursesFor("React").map((c) => c.provider)).toContain("freeCodeCamp");
    expect(coursesFor("Marcenaria").length).toBeGreaterThan(0);
  });
});

describe("validações novas", () => {
  it("contato: CEP e WhatsApp", () => {
    expect(contactSchema.parse({ postalCode: "01310-100", whatsapp: "(11) 91234-5678", whatsappOptIn: true })).toEqual({ postalCode: "01310100", whatsapp: "11912345678", whatsappOptIn: true });
    expect(contactSchema.safeParse({ postalCode: "123" }).success).toBe(false);
  });
  it("projeto e acompanhamento", () => {
    expect(projectSchema.safeParse({ title: "App", description: "curto", school: "Escola", teacherName: "Prof", teacherEmail: "x" }).success).toBe(false);
    expect(checkinSchema.safeParse({ score: 6 }).success).toBe(false);
  });
  it("vaga aceita aprendiz, PcD e CEP", () => {
    const base = { title: "Aprendiz", description: "Descrição longa o bastante para passar.", area: "Adm", location: "São Paulo", workMode: "ONSITE",
      contractType: "CLT", seniority: "INTERN", minYears: 0, salaryMin: 900, salaryMax: 1100, skills: [] };
    expect(jobSchema.parse({ ...base, forApprentice: true, postalCode: "01310-100" })).toMatchObject({ forApprentice: true, pcdOnly: false, postalCode: "01310100" });
  });
});
