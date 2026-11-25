import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { deleteAccount, exportUserData } from "@/modules/privacy.service";

const outbox = path.join(mkdtempSync(path.join(tmpdir(), "nautiwork-priv-")), "outbox.jsonl");
const mails = () => { try { return readFileSync(outbox, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
let seq = 0;
const email = () => `priv-${Date.now().toString(36)}-${seq++}@test.local`;
const hash = () => bcrypt.hash("Senha1234", 4);

async function expectHttp(p: Promise<unknown>, status: number) {
  const err = await p.then(() => null, (e) => e);
  expect(err).toBeInstanceOf(HttpError);
  expect((err as HttpError).status).toBe(status);
}

/** Empresa com uma vaga e um candidato com candidatura em andamento. */
async function scenario() {
  const company = await db.user.create({ data: { name: "Dona", email: email(), role: "COMPANY", passwordHash: await hash(),
    company: { create: { name: "Empresa Teste" } } }, include: { company: true } });
  const job = await db.job.create({ data: { companyId: company.company!.id, title: "Dev Júnior", description: "Descrição da vaga de teste.",
    area: "TI", location: "São Paulo", workMode: "REMOTE", contractType: "CLT", seniority: "JUNIOR" } });
  const cand = await db.user.create({ data: { name: "Ana", email: email(), role: "CANDIDATE", passwordHash: await hash(),
    termsAcceptedAt: new Date(), termsVersion: "2026-11-24",
    candidate: { create: { headline: "Dev front-end", educations: { create: { institution: "ETEC", course: "DS", startYear: 2024 } } } } },
    include: { candidate: true } });
  await db.jobApplication.create({ data: { jobId: job.id, candidateId: cand.candidate!.id, history: { create: { status: "SUBMITTED" } } } });
  await db.supportTicket.create({ data: { userId: cand.id, subject: "Dúvida", category: "OTHER", messages: { create: { authorId: cand.id, body: "Olá" } } } });
  return { company, job, cand };
}

beforeAll(() => {
  writeFileSync(outbox, "");
  process.env.MAIL_DEV_OUTBOX = outbox;
  process.env.APP_URL = "https://app.exemplo.test";
  delete process.env.RESEND_API_KEY;
});
afterAll(async () => { delete process.env.MAIL_DEV_OUTBOX; await db.$disconnect(); });

describe("exportar meus dados", () => {
  it("traz perfil, candidaturas, suporte e aceite dos termos, sem senha nem tokens", async () => {
    const { cand } = await scenario();
    const data = await exportUserData(cand.id);
    expect(data.conta.email).toBe(cand.email);
    expect(data.conta.termsVersion).toBe("2026-11-24");
    expect(data.perfilCandidato?.headline).toBe("Dev front-end");
    expect(data.perfilCandidato?.educations).toHaveLength(1);
    expect(data.perfilCandidato?.applications[0].job.title).toBe("Dev Júnior");
    expect(data.pedidosDeSuporte[0].messages[0].body).toBe("Olá");
    const json = JSON.stringify(data);
    expect(json).not.toContain("passwordHash");
    expect(json).not.toContain("tokenHash");
  });

  it("para empresa, lista as vagas com o número de candidaturas", async () => {
    const { company } = await scenario();
    const data = await exportUserData(company.id);
    expect(data.perfilEmpresa?.jobs[0]).toMatchObject({ title: "Dev Júnior", candidaturasRecebidas: 1 });
  });
});

describe("excluir conta", () => {
  it("recusa senha errada e confirmação diferente de EXCLUIR", async () => {
    const { cand } = await scenario();
    await expectHttp(deleteAccount(cand.id, { password: "errada123", confirm: "EXCLUIR" }), 400);
    await expect(deleteAccount(cand.id, { password: "Senha1234", confirm: "sim" })).rejects.toThrow();
    expect(await db.user.findUnique({ where: { id: cand.id } })).not.toBeNull();
  });

  it("candidato: apaga a conta e tudo o que depende dela, sem afetar a empresa", async () => {
    const { cand, job } = await scenario();
    await deleteAccount(cand.id, { password: "Senha1234", confirm: "excluir" });
    expect(await db.user.findUnique({ where: { id: cand.id } })).toBeNull();
    expect(await db.candidateProfile.findUnique({ where: { userId: cand.id } })).toBeNull();
    expect(await db.supportTicket.count({ where: { userId: cand.id } })).toBe(0);
    expect(await db.jobApplication.count({ where: { jobId: job.id } })).toBe(0);
    expect(await db.job.findUnique({ where: { id: job.id } })).not.toBeNull();
  });

  it("empresa: apaga vagas e avisa no site e por e-mail os candidatos com processo em andamento", async () => {
    const { company, job, cand } = await scenario();
    writeFileSync(outbox, "");
    const r = await deleteAccount(company.id, { password: "Senha1234", confirm: "EXCLUIR" });
    expect(r.candidatesNotified).toBe(1);
    expect(await db.job.findUnique({ where: { id: job.id } })).toBeNull();
    const n = await db.notification.findFirst({ where: { userId: cand.id }, orderBy: { createdAt: "desc" } });
    expect(n?.body).toContain("Empresa Teste");
    expect(mails().map((m) => m.to)).toEqual([cand.email]);
  });

  it("não deixa administrador se excluir", async () => {
    const admin = await db.user.create({ data: { name: "Admin", email: email(), role: "ADMIN", passwordHash: await hash() } });
    await expectHttp(deleteAccount(admin.id, { password: "Senha1234", confirm: "EXCLUIR" }), 403);
  });
});
