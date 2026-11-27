import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { createJob, setJobStatus, updateJob } from "@/modules/jobs.service";
import { applyToJob, updateApplicationStatus, withdrawApplication } from "@/modules/applications.service";
import { addEducation, deleteEducation, updateExperience, addExperience } from "@/modules/resume.service";
import { changePassword, markNotificationsRead, updateCompanyProfile } from "@/modules/account.service";
import { canViewImage, saveUserImage } from "@/modules/images";
import { confirmJob, expireStaleJobs, notifyNoReply, responseStats } from "@/modules/hiring";
import { recordResumeView } from "@/modules/resume-views";

let seq = 0;
const uid = () => `${Date.now().toString(36)}-${seq++}`;

async function makeCandidate(opts: { complete?: boolean } = { complete: true }) {
  const user = await db.user.create({
    data: {
      name: "Candidata Teste", email: `cand-${uid()}@test.local`, role: "CANDIDATE",
      passwordHash: await bcrypt.hash("Senha1234", 4),
      candidate: { create: opts.complete ? {
        headline: "Dev", interestArea: "Tecnologia", workMode: "REMOTE", location: "Recife", yearsExperience: 2,
        skills: { create: [{ skill: { connectOrCreate: { where: { name: "TypeScript" }, create: { name: "TypeScript" } } } }] },
      } : {} },
    },
    include: { candidate: true },
  });
  return user;
}

async function makeCompany() {
  return db.user.create({
    data: {
      name: "Empresa Teste", email: `emp-${uid()}@test.local`, role: "COMPANY",
      passwordHash: await bcrypt.hash("Senha1234", 4), company: { create: { name: `Empresa ${uid()}` } },
    },
    include: { company: true },
  });
}

const jobInput = {
  title: "Vaga de integração", description: "Descrição longa o bastante para passar na validação.",
  area: "Tecnologia", location: "Recife", workMode: "REMOTE", contractType: "CLT", seniority: "JUNIOR",
  minYears: 1, salaryMin: 3000, salaryMax: 4500, skills: ["TypeScript"],
};

async function expectHttp(p: Promise<unknown>, status: number) {
  const err = await p.then(() => null, (e) => e);
  expect(err).toBeInstanceOf(HttpError);
  expect((err as HttpError).status).toBe(status);
}

let companyA: Awaited<ReturnType<typeof makeCompany>>;
let companyB: Awaited<ReturnType<typeof makeCompany>>;
let jobId: string;

beforeAll(async () => {
  companyA = await makeCompany();
  companyB = await makeCompany();
  jobId = (await createJob(companyA.id, jobInput)).id;
});
afterAll(async () => { await db.$disconnect(); });

describe("candidatura", () => {
  it("cria a candidatura com compatibilidade, histórico e notificações para os dois lados", async () => {
    const cand = await makeCandidate();
    const app = await applyToJob(cand.id, { jobId });
    expect(app.compatibility).toBeGreaterThan(0);
    const history = await db.applicationStatusHistory.findMany({ where: { applicationId: app.id } });
    expect(history.map((h) => h.status)).toEqual(["SUBMITTED"]);
    expect(await db.notification.count({ where: { userId: cand.id } })).toBe(1);
    expect(await db.notification.count({ where: { userId: companyA.id, title: "Nova candidatura" } })).toBeGreaterThan(0);
  });

  it("recusa candidatura duplicada com 409 e mantém um único registro", async () => {
    const cand = await makeCandidate();
    await applyToJob(cand.id, { jobId });
    await expectHttp(applyToJob(cand.id, { jobId }), 409);
    expect(await db.jobApplication.count({ where: { jobId, candidateId: cand.candidate!.id } })).toBe(1);
  });

  it("duas candidaturas simultâneas do mesmo candidato resultam em uma só", async () => {
    const cand = await makeCandidate();
    const results = await Promise.allSettled([applyToJob(cand.id, { jobId }), applyToJob(cand.id, { jobId })]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.jobApplication.count({ where: { jobId, candidateId: cand.candidate!.id } })).toBe(1);
  });

  it("exige perfil completo (422)", async () => {
    const cand = await makeCandidate({ complete: false });
    await expectHttp(applyToJob(cand.id, { jobId }), 422);
  });

  it("recusa vaga pausada (409)", async () => {
    const paused = await createJob(companyA.id, jobInput);
    await setJobStatus(companyA.id, paused.id, "PAUSED");
    const cand = await makeCandidate();
    await expectHttp(applyToJob(cand.id, { jobId: paused.id }), 409);
  });
});

describe("status e permissões entre empresas", () => {
  it("empresa dona atualiza o status e cada mudança entra no histórico", async () => {
    const cand = await makeCandidate();
    const app = await applyToJob(cand.id, { jobId });
    await updateApplicationStatus(companyA.id, app.id, { status: "IN_REVIEW" });
    await updateApplicationStatus(companyA.id, app.id, { status: "IN_REVIEW" }); // repetido: não duplica histórico
    await updateApplicationStatus(companyA.id, app.id, { status: "APPROVED" });
    const history = await db.applicationStatusHistory.findMany({ where: { applicationId: app.id }, orderBy: { createdAt: "asc" } });
    expect(history.map((h) => h.status)).toEqual(["SUBMITTED", "IN_REVIEW", "APPROVED"]);
    expect(history.slice(1).every((h) => h.changedById === companyA.id)).toBe(true);
    expect(await db.notification.count({ where: { userId: cand.id, title: "Candidatura atualizada" } })).toBe(2);
  });

  it("outra empresa recebe 403 ao mudar status, e nada muda", async () => {
    const cand = await makeCandidate();
    const app = await applyToJob(cand.id, { jobId });
    await expectHttp(updateApplicationStatus(companyB.id, app.id, { status: "REJECTED", reason: "OTHER" }), 403);
    expect((await db.jobApplication.findUniqueOrThrow({ where: { id: app.id } })).status).toBe("SUBMITTED");
    expect(await db.applicationStatusHistory.count({ where: { applicationId: app.id } })).toBe(1);
  });

  it("outra empresa recebe 403 ao editar, pausar ou encerrar a vaga", async () => {
    await expectHttp(updateJob(companyB.id, jobId, { ...jobInput, title: "Invadida" }), 403);
    await expectHttp(setJobStatus(companyB.id, jobId, "CLOSED"), 403);
    const job = await db.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.title).toBe(jobInput.title);
    expect(job.status).toBe("ACTIVE");
  });

  it("candidatura retirada não pode ter o status alterado (409)", async () => {
    const cand = await makeCandidate();
    const app = await applyToJob(cand.id, { jobId });
    await withdrawApplication(cand.id, app.id);
    await expectHttp(updateApplicationStatus(companyA.id, app.id, { status: "APPROVED" }), 409);
  });

  it("candidato não retira candidatura de outra pessoa (404)", async () => {
    const owner = await makeCandidate();
    const intruder = await makeCandidate();
    const app = await applyToJob(owner.id, { jobId });
    await expectHttp(withdrawApplication(intruder.id, app.id), 404);
  });

  it("vaga encerrada não pode ser reaberta e notifica candidaturas em andamento", async () => {
    const job = await createJob(companyA.id, jobInput);
    const cand = await makeCandidate();
    await applyToJob(cand.id, { jobId: job.id });
    await setJobStatus(companyA.id, job.id, "CLOSED");
    expect(await db.notification.count({ where: { userId: cand.id, title: "Vaga encerrada" } })).toBe(1);
    await expectHttp(setJobStatus(companyA.id, job.id, "ACTIVE"), 409);
  });
});

describe("currículo, conta e notificações", () => {
  it("candidato só altera a própria formação e experiência (404 para as dos outros)", async () => {
    const a = await makeCandidate();
    const b = await makeCandidate();
    const edu = await addEducation(a.id, { institution: "UFPE", course: "Sistemas de Informação", startYear: 2021, endYear: "" });
    expect(edu.endYear).toBeNull();
    await expectHttp(deleteEducation(b.id, edu.id), 404);
    const exp = await addExperience(a.id, { company: "Loja", role: "Estagiária", startDate: "2023-02-01" });
    await expectHttp(updateExperience(b.id, exp.id, { company: "X", role: "Y", startDate: "2023-01-01" }), 404);
    await deleteEducation(a.id, edu.id);
    expect(await db.education.count({ where: { id: edu.id } })).toBe(0);
  });

  it("perfil da empresa: salva campos e aceita apagar opcionais", async () => {
    const c = await makeCompany();
    await updateCompanyProfile(c.id, { name: "Nova Razão", website: "https://exemplo.com.br", industry: "Varejo", description: "", location: "" });
    let p = await db.companyProfile.findUniqueOrThrow({ where: { userId: c.id } });
    expect(p).toMatchObject({ name: "Nova Razão", website: "https://exemplo.com.br", industry: "Varejo", description: null });
    await updateCompanyProfile(c.id, { name: "Nova Razão", website: "", industry: "" });
    p = await db.companyProfile.findUniqueOrThrow({ where: { userId: c.id } });
    expect(p.website).toBeNull();
    expect(p.industry).toBeNull();
  });

  it("marca como lidas só as notificações do próprio usuário", async () => {
    const a = await makeCandidate();
    const b = await makeCandidate();
    const na = await db.notification.create({ data: { userId: a.id, title: "t", body: "b" } });
    const nb = await db.notification.create({ data: { userId: b.id, title: "t", body: "b" } });
    const r = await markNotificationsRead(a.id, { ids: [na.id, nb.id] });
    expect(r.updated).toBe(1);
    expect((await db.notification.findUniqueOrThrow({ where: { id: nb.id } })).read).toBe(false);
    await db.notification.create({ data: { userId: a.id, title: "t2", body: "b" } });
    await markNotificationsRead(a.id, { all: true });
    expect(await db.notification.count({ where: { userId: a.id, read: false } })).toBe(0);
  });

  it("troca de senha exige a senha atual correta", async () => {
    const a = await makeCandidate();
    await expectHttp(changePassword(a.id, { currentPassword: "errada123", newPassword: "Nova12345" }), 400);
    await changePassword(a.id, { currentPassword: "Senha1234", newPassword: "Nova12345" });
    const u = await db.user.findUniqueOrThrow({ where: { id: a.id } });
    expect(await bcrypt.compare("Nova12345", u.passwordHash)).toBe(true);
  });
});

describe("imagens", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

  it("logotipo de empresa é público; foto de candidato só para quem pode ver", async () => {
    const cand = await makeCandidate();
    const otherCompany = await makeCompany();
    await saveUserImage(cand.id, png);
    await saveUserImage(companyA.id, png);
    expect(await canViewImage(companyA.id, null)).toBe(true);
    expect(await canViewImage(cand.id, null)).toBe(false);
    expect(await canViewImage(cand.id, { id: cand.id, role: "CANDIDATE" })).toBe(true);
    expect(await canViewImage(cand.id, { id: otherCompany.id, role: "COMPANY" })).toBe(false);
    await applyToJob(cand.id, { jobId });
    expect(await canViewImage(cand.id, { id: companyA.id, role: "COMPANY" })).toBe(true);
    expect(await canViewImage(cand.id, { id: otherCompany.id, role: "COMPANY" })).toBe(false);
  });

  it("recusa arquivo que não é imagem mesmo com extensão de imagem (415)", async () => {
    const cand = await makeCandidate();
    await expectHttp(saveUserImage(cand.id, new TextEncoder().encode("<svg onload=alert(1)>")), 415);
    expect(await db.userImage.count({ where: { userId: cand.id } })).toBe(0);
  });
});

describe("vaga com validade", () => {
  it("pausa a vaga sem confirmação há 30 dias, avisa a empresa uma vez e volta ao confirmar", async () => {
    const job = await createJob(companyA.id, jobInput);
    await db.job.update({ where: { id: job.id }, data: { confirmedAt: new Date(Date.now() - 31 * 86_400_000) } });
    expect(await expireStaleJobs()).toBeGreaterThanOrEqual(1);
    const paused = await db.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(paused.status).toBe("PAUSED");
    expect(paused.expiredAt).not.toBeNull();
    const notes = await db.notification.count({ where: { userId: companyA.id, title: "Vagas pausadas por falta de confirmação" } });
    await expireStaleJobs();
    expect(await db.notification.count({ where: { userId: companyA.id, title: "Vagas pausadas por falta de confirmação" } })).toBe(notes);
    await expectHttp(confirmJob(companyB.id, job.id), 403);
    const back = await confirmJob(companyA.id, job.id);
    expect(back.status).toBe("ACTIVE");
    expect(back.expiredAt).toBeNull();
  });
  it("pausa manual continua pausada ao confirmar", async () => {
    const job = await createJob(companyA.id, jobInput);
    await setJobStatus(companyA.id, job.id, "PAUSED");
    expect((await confirmJob(companyA.id, job.id)).status).toBe("PAUSED");
  });
});

describe("resposta da empresa", () => {
  it("avisa o candidato depois de 14 dias sem resposta, uma única vez", async () => {
    const company = await makeCompany();
    const job = await createJob(company.id, jobInput);
    const cand = await makeCandidate();
    const app = await applyToJob(cand.id, { jobId: job.id });
    await db.jobApplication.update({ where: { id: app.id }, data: { createdAt: new Date(Date.now() - 15 * 86_400_000) } });
    await notifyNoReply();
    await notifyNoReply();
    expect(await db.notification.count({ where: { userId: cand.id, title: "Sem retorno da empresa" } })).toBe(1);
  });
  it("calcula a taxa de resposta pelas candidaturas reais", async () => {
    const company = await makeCompany();
    const job = await createJob(company.id, jobInput);
    for (let i = 0; i < 3; i++) {
      const cand = await makeCandidate();
      const app = await applyToJob(cand.id, { jobId: job.id });
      await db.jobApplication.update({ where: { id: app.id }, data: { createdAt: new Date(Date.now() - 20 * 86_400_000) } });
      await updateApplicationStatus(company.id, app.id, { status: "IN_REVIEW" });
    }
    const stats = (await responseStats([company.company!.id])).get(company.company!.id)!;
    expect(stats.decided).toBe(3);
    expect(stats.rate).toBe(100);
  });
});

describe("quem viu meu currículo", () => {
  it("registra a empresa uma vez por visita e avisa o candidato só na primeira", async () => {
    const cand = await makeCandidate();
    const view = await recordResumeView(companyA.company!.id, cand.candidate!.id);
    expect(view?.count).toBe(1);
    const again = await recordResumeView(companyA.company!.id, cand.candidate!.id);
    expect(again?.count).toBe(1);
    const later = await recordResumeView(companyA.company!.id, cand.candidate!.id, new Date(Date.now() + 3_600_000));
    expect(later?.count).toBe(2);
    expect(await db.notification.count({ where: { userId: cand.id, title: "Uma empresa abriu seu currículo" } })).toBe(1);
  });
});
