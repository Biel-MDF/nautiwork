import { beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { createJob } from "@/modules/jobs.service";
import { applyToJob, updateApplicationStatus } from "@/modules/applications.service";
import { reportJob, AUTO_HOLD_REPORTS } from "@/modules/reports.service";
import { startCheck, submitCheck } from "@/modules/skill-checks.service";
import { testBySlug } from "@/modules/skill-tests/bank";
import { createProject, deleteProject, validateProject } from "@/modules/projects.service";
import { updateCompliance } from "@/modules/company-compliance.service";
import { updateContact } from "@/modules/contact.service";
import { answerCheckin, createDueCheckins } from "@/modules/hiring";
import { searchJobs } from "@/modules/jobs.service";
import { exportUserData } from "@/modules/privacy.service";

let seq = 0;
const uid = () => `${Date.now().toString(36)}-d${seq++}`;
const DAY = 86_400_000;

const makeCandidate = async () => db.user.create({ data: { name: "Aluna Teste", email: `al-${uid()}@test.local`, role: "CANDIDATE", passwordHash: await bcrypt.hash("Senha1234", 4),
  candidate: { create: { headline: "Estudante", interestArea: "Tecnologia", workMode: "ONSITE", location: "São Paulo", yearsExperience: 0,
    skills: { create: [{ skill: { connectOrCreate: { where: { name: "Planilhas" }, create: { name: "Planilhas" } } } }] } } } }, include: { candidate: true } });
const makeCompany = async () => db.user.create({ data: { name: "Empresa D", email: `ed-${uid()}@test.local`, role: "COMPANY", passwordHash: await bcrypt.hash("Senha1234", 4),
  company: { create: { name: `Empresa D ${uid()}` } } }, include: { company: true } });

const base = { title: "Auxiliar administrativo", description: "Apoio ao time administrativo, planilhas e atendimento.", area: "Administração", location: "São Paulo",
  workMode: "ONSITE", contractType: "CLT", seniority: "JUNIOR", minYears: 0, salaryMin: 1800, salaryMax: 2200, skills: ["Excel", "SQL"] };

async function expectHttp(p: Promise<unknown>, status: number) {
  const err = await p.then(() => null, (e) => e);
  expect(err).toBeInstanceOf(HttpError);
  expect((err as HttpError).status).toBe(status);
  return err as HttpError;
}
const json = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

let company: Awaited<ReturnType<typeof makeCompany>>;
beforeAll(async () => { company = await makeCompany(); });

describe("publicação com antigolpe e coerência", () => {
  it("recusa vaga que pede dinheiro, com o campo do erro", async () => {
    const err = await expectHttp(createJob(company.id, { ...base, description: "Pague a taxa de inscrição via Pix para participar." }), 400);
    expect(err.fields?.description?.[0]).toMatch(/não publica/);
  });
  it("recusa estágio pedindo experiência", async () => {
    const err = await expectHttp(createJob(company.id, { ...base, contractType: "INTERNSHIP", seniority: "INTERN", requirements: "2 anos de experiência" }), 400);
    expect(err.fields?.requirements).toBeDefined();
  });
  it("retém para moderação vaga com sinal fraco e avisa a empresa", async () => {
    const job = await createJob(company.id, { ...base, description: "Renda extra! Fale no WhatsApp para saber mais sobre a vaga." });
    expect(job.flagged).toBe(true);
    expect((await db.job.findUniqueOrThrow({ where: { id: job.id } })).flagged).toBe(true);
    expect(await db.notification.count({ where: { userId: company.id, title: "Vaga em análise" } })).toBeGreaterThan(0);
  });
  it("filtra Jovem Aprendiz e PcD", async () => {
    const a = await createJob(company.id, { ...base, title: `Aprendiz ${uid()}`, forApprentice: true, seniority: "INTERN" });
    const p = await createJob(company.id, { ...base, title: `PcD ${uid()}`, pcdOnly: true });
    const ra = await searchJobs({ aprendiz: "1", page: 1 });
    const rp = await searchJobs({ pcd: "1", page: 1 });
    expect(ra.items.map((j) => j.id)).toContain(a.id);
    expect(ra.items.every((j) => j.forApprentice)).toBe(true);
    expect(rp.items.map((j) => j.id)).toContain(p.id);
    expect(rp.items.map((j) => j.id)).not.toContain(a.id);
  });
});

describe("denúncia de vaga", () => {
  it("três denúncias de pessoas diferentes retêm a vaga; repetir é 409; a própria empresa não denuncia", async () => {
    const job = await createJob(company.id, { ...base, title: `Denunciada ${uid()}` });
    await expectHttp(reportJob(company.id, job.id, { reason: "SCAM" }), 400);
    const people = [await makeCandidate(), await makeCandidate(), await makeCandidate()];
    const r1 = await reportJob(people[0].id, job.id, { reason: "SCAM", details: "pediu Pix no WhatsApp" });
    expect(r1).toEqual({ count: 1, held: false });
    await expectHttp(reportJob(people[0].id, job.id, { reason: "FAKE" }), 409);
    await reportJob(people[1].id, job.id, { reason: "FAKE" });
    const r3 = await reportJob(people[2].id, job.id, { reason: "SCAM" });
    expect(r3).toEqual({ count: AUTO_HOLD_REPORTS, held: true });
    expect((await db.job.findUniqueOrThrow({ where: { id: job.id } })).flagged).toBe(true);
  });
});

describe("recusa com motivo", () => {
  it("guarda motivo e habilidades e avisa o candidato com o motivo", async () => {
    const job = await createJob(company.id, { ...base, title: `Recusa ${uid()}` });
    const cand = await makeCandidate();
    const app = await applyToJob(cand.id, { jobId: job.id });
    await expect(updateApplicationStatus(company.id, app.id, { status: "REJECTED" })).rejects.toThrow(/motivo/);
    await updateApplicationStatus(company.id, app.id, { status: "REJECTED", reason: "SKILLS", missingSkills: ["SQL"] });
    const saved = await db.jobApplication.findUniqueOrThrow({ where: { id: app.id } });
    expect(saved.rejectReason).toBe("SKILLS");
    expect(saved.rejectSkills).toEqual(["SQL"]);
    const n = await db.notification.findFirstOrThrow({ where: { userId: cand.id, title: "Candidatura atualizada" }, orderBy: { createdAt: "desc" } });
    expect(n.body).toMatch(/faltaram habilidades.*SQL/);
  });
});

describe("prova de habilidade", () => {
  it("passa, marca a habilidade como comprovada e não deixa refazer", async () => {
    const cand = await makeCandidate();
    const started = await startCheck(cand.id, "excel");
    expect(started.questions).toHaveLength(5);
    expect(JSON.stringify(started)).not.toMatch(/"answer"/);
    // retomar devolve a mesma prova
    expect((await startCheck(cand.id, "excel")).id).toBe(started.id);
    const row = await db.skillCheck.findUniqueOrThrow({ where: { id: started.id } });
    const t = testBySlug("excel")!;
    const answers = row.questionIds.map((sid) => { const [qid, order] = sid.split(":"); const q = t.questions.find((x) => x.id === qid)!; return [...order].map(Number).indexOf(q.answer); });
    const r = await submitCheck(cand.id, started.id, { answers });
    expect(r).toMatchObject({ score: 5, passed: true, late: false });
    await expectHttp(submitCheck(cand.id, started.id, { answers }), 409);
    const skill = await db.candidateSkill.findFirstOrThrow({ where: { candidateId: cand.candidate!.id, skill: { name: "Planilhas" } } });
    expect(skill.verifiedAt).not.toBeNull();
    await expectHttp(startCheck(cand.id, "excel"), 409);
  });
  it("reprovou: espera 7 dias; prova abandonada conta como tentativa; envio atrasado vale zero", async () => {
    const cand = await makeCandidate();
    const t0 = new Date();
    const a = await startCheck(cand.id, "sql", t0);
    const late = await submitCheck(cand.id, a.id, { answers: [0, 0, 0, 0, 0] }, new Date(t0.getTime() + 20 * 60_000));
    expect(late).toMatchObject({ score: 0, passed: false, late: true });
    await expectHttp(startCheck(cand.id, "sql", new Date(t0.getTime() + DAY)), 429);
    const b = await startCheck(cand.id, "git", t0);
    // abriu e saiu: 15 minutos depois, a próxima tentativa encerra a anterior com zero e pede para esperar
    await expectHttp(startCheck(cand.id, "git", new Date(t0.getTime() + 15 * 60_000)), 429);
    expect((await db.skillCheck.findUniqueOrThrow({ where: { id: b.id } })).score).toBe(0);
    const c = await startCheck(cand.id, "sql", new Date(t0.getTime() + 8 * DAY));
    expect(c.id).not.toBe(a.id);
  });
  it("outra pessoa não envia a prova", async () => {
    const [x, y] = [await makeCandidate(), await makeCandidate()];
    const s = await startCheck(x.id, "python");
    await expectHttp(submitCheck(y.id, s.id, { answers: [0, 0, 0, 0, 0] }), 404);
  });
});

describe("projeto confirmado pelo professor", () => {
  it("link de uso único; o aluno não confirma o próprio; o token não fica no banco", async () => {
    const cand = await makeCandidate();
    const input = { title: "Sistema da cantina", description: "Sistema web para pedidos da cantina da escola, com Next.js.", school: "ETEC Teste", teacherName: "Prof. Ana", teacherEmail: "prof@test.local" };
    const { project, link } = await createProject(cand.id, input, "http://localhost:3000");
    const token = link.split("/validar-projeto/")[1];
    expect(token.length).toBeGreaterThan(30);
    expect(project.tokenHash).not.toBe(token);
    await expectHttp(validateProject({ token, teacherName: "Prof. Ana", confirm: true }, cand.id), 403);
    await validateProject({ token, teacherName: "Profa. Ana Souza", confirm: true, note: "Trabalho muito bem feito." }, null);
    const v = await db.project.findUniqueOrThrow({ where: { id: project.id } });
    expect(v.validatedAt).not.toBeNull();
    expect(v.teacherName).toBe("Profa. Ana Souza");
    expect(v.tokenHash).toBeNull();
    await expectHttp(validateProject({ token, teacherName: "Outro", confirm: true }, null), 404);
    const other = await makeCandidate();
    await expectHttp(deleteProject(other.id, project.id), 404);
    await deleteProject(cand.id, project.id);
    expect(await db.project.count({ where: { id: project.id } })).toBe(0);
  });
});

describe("cotas e CNPJ", () => {
  it("verifica CNPJ ativo, recusa inválido e duplicado", async () => {
    const c1 = await makeCompany(), c2 = await makeCompany();
    const cnpj = "11.222.333/0001-81";
    await expectHttp(updateCompliance(c1.id, { cnpj: "11.222.333/0001-82", companySize: "MEDIUM", employees: 150 }, json({})), 400);
    await db.companyProfile.updateMany({ where: { cnpj: "11222333000181" }, data: { cnpj: null } });
    const r = await updateCompliance(c1.id, { cnpj, companySize: "MEDIUM", employees: 150, apprentices: 2 }, json({ razao_social: "TESTE LTDA", descricao_situacao_cadastral: "ATIVA" }));
    expect(r.company.cnpjVerifiedAt).not.toBeNull();
    expect(r.company.legalName).toBe("TESTE LTDA");
    await expectHttp(updateCompliance(c2.id, { cnpj, companySize: "ME", employees: 3 }, json({})), 409);
    const inactive = await updateCompliance(c2.id, { cnpj: "11444777000161", companySize: "ME", employees: 3 }, json({ razao_social: "X", descricao_situacao_cadastral: "BAIXADA" }));
    expect(inactive.company.cnpjVerifiedAt).toBeNull();
    expect(inactive.notice).toMatch(/baixada/);
    await db.companyProfile.updateMany({ where: { id: { in: [c1.company!.id, c2.company!.id] } }, data: { cnpj: null } });
  });
});

describe("contato, deslocamento e acompanhamento", () => {
  it("geocodifica o CEP e só autoriza WhatsApp com número", async () => {
    const cand = await makeCandidate();
    const r = await updateContact(cand.id, { postalCode: "01310-100", whatsappOptIn: true },
      json({ city: "São Paulo", state: "SP", location: { coordinates: { latitude: "-23.56", longitude: "-46.65" } } }));
    expect(r.located).toBe(true);
    const p = await db.candidateProfile.findUniqueOrThrow({ where: { userId: cand.id } });
    expect(p).toMatchObject({ postalCode: "01310100", lat: -23.56, lng: -46.65, whatsappOptIn: false });
  });
  it("cria perguntas de 30 dias para os dois lados; a nota do candidato não vai para a empresa", async () => {
    const job = await createJob(company.id, { ...base, title: `Contratação ${uid()}` });
    const cand = await makeCandidate();
    const app = await applyToJob(cand.id, { jobId: job.id });
    await updateApplicationStatus(company.id, app.id, { status: "APPROVED" });
    await db.jobApplication.update({ where: { id: app.id }, data: { hiredAt: new Date(Date.now() - 31 * DAY) } });
    expect(await createDueCheckins()).toBeGreaterThanOrEqual(2);
    expect(await createDueCheckins()).toBe(0);
    const mine = await db.hireCheckin.findFirstOrThrow({ where: { applicationId: app.id, role: "CANDIDATE", day: 30 } });
    const theirs = await db.hireCheckin.findFirstOrThrow({ where: { applicationId: app.id, role: "COMPANY", day: 30 } });
    await expectHttp(answerCheckin(company.id, mine.id, { score: 5, wantsTalk: false }), 404);
    await answerCheckin(cand.id, mine.id, { score: 2, wantsTalk: true, comment: "Muito puxado" });
    await expectHttp(answerCheckin(cand.id, mine.id, { score: 3, wantsTalk: false }), 409);
    await answerCheckin(company.id, theirs.id, { score: 4, wantsTalk: true });
    const n = await db.notification.findFirstOrThrow({ where: { userId: company.id, title: "Pedido de conversa" }, orderBy: { createdAt: "desc" } });
    expect(n.body).not.toMatch(/puxado|nota/);
    expect((await db.hireCheckin.findUniqueOrThrow({ where: { id: theirs.id } })).wantsTalk).toBe(false);
    const data = await exportUserData(cand.id);
    expect(JSON.stringify(data)).toContain("Muito puxado");
  });
});

describe("Imperador (administrador maior)", () => {
  it("só o Imperador desativa administradores, e ninguém desativa o Imperador", async () => {
    const { setUserActive } = await import("@/modules/admin-users.service");
    const mk = (emperor = false) => db.user.create({ data: { name: "Admin", email: `adm-${uid()}@test.local`, role: "ADMIN", passwordHash: "x", emperor } });
    await db.user.updateMany({ where: { emperor: true }, data: { emperor: false } });
    const emperor = await mk(true), a1 = await mk(), a2 = await mk();
    const cand = await makeCandidate();
    await expectHttp(setUserActive(a1.id, a2.id, false), 403);
    await expectHttp(setUserActive(a1.id, emperor.id, false), 403);
    await expectHttp(setUserActive(emperor.id, emperor.id, false), 400);
    expect(await setUserActive(a1.id, cand.id, false)).toMatchObject({ active: false });
    expect(await setUserActive(emperor.id, a2.id, false)).toMatchObject({ active: false });
    await expect(mk(true)).rejects.toThrow();
    await db.user.update({ where: { id: emperor.id }, data: { emperor: false } });
  });
});
