import { describe, expect, it } from "vitest";
import { computeResponse, jobValidity, noReplyDays, type ResponseSample } from "@/modules/hiring";
import { jobSchema } from "@/lib/validators";

const now = new Date("2026-11-26T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const s = (created: number, responded: number | null, status = "IN_REVIEW"): ResponseSample =>
  ({ createdAt: daysAgo(created), status: responded === null ? status : "IN_REVIEW", firstResponseAt: responded === null ? null : daysAgo(created - responded) });

describe("validade da vaga", () => {
  it("vale 30 dias e avisa na última semana", () => {
    expect(jobValidity(daysAgo(10), now)).toMatchObject({ daysLeft: 20, expired: false, warn: false });
    expect(jobValidity(daysAgo(25), now)).toMatchObject({ daysLeft: 5, expired: false, warn: true });
    expect(jobValidity(daysAgo(30), now).expired).toBe(true);
  });
});

describe("selo de resposta", () => {
  it("precisa de pelo menos 3 candidaturas decididas", () => {
    expect(computeResponse([s(20, 2), s(20, 3)], now)).toBeNull();
  });
  it("não conta candidaturas recentes sem resposta", () => {
    const r = computeResponse([s(20, 2), s(20, 3), s(20, 4), s(3, null, "SUBMITTED")], now)!;
    expect(r.decided).toBe(3);
    expect(r.rate).toBe(100);
    expect(r.medianDays).toBe(3);
    expect(r.badge).toBe(true);
  });
  it("tira o selo de quem deixa candidaturas sem resposta", () => {
    const r = computeResponse([s(30, 2), s(30, null, "SUBMITTED"), s(30, null, "SUBMITTED"), s(30, 1)], now)!;
    expect(r.rate).toBe(50);
    expect(r.badge).toBe(false);
  });
  it("tira o selo de quem demora", () => {
    const r = computeResponse([s(40, 10), s(40, 12), s(40, 15)], now)!;
    expect(r.rate).toBe(100);
    expect(r.badge).toBe(false);
  });
});

describe("sem retorno", () => {
  it("conta só candidaturas paradas há 14 dias ou mais", () => {
    expect(noReplyDays(daysAgo(13), "SUBMITTED", now)).toBe(0);
    expect(noReplyDays(daysAgo(15), "SUBMITTED", now)).toBe(15);
    expect(noReplyDays(daysAgo(40), "IN_REVIEW", now)).toBe(0);
  });
});

describe("faixa salarial obrigatória", () => {
  const base = { title: "Dev", description: "Descrição longa o bastante da vaga.", area: "TI", location: "Recife", workMode: "REMOTE", contractType: "CLT", seniority: "MID" };
  it("recusa vaga sem salário e aceita com faixa", () => {
    expect(jobSchema.safeParse(base).success).toBe(false);
    expect(jobSchema.safeParse({ ...base, salaryMin: 3000, salaryMax: 2000 }).success).toBe(false);
    expect(jobSchema.safeParse({ ...base, salaryMin: 3000, salaryMax: 4000 }).success).toBe(true);
  });
});
