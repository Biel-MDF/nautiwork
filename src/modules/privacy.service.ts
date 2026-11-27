import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { deleteAccountSchema } from "@/lib/validators";
import { emailNotify } from "./notify";
import { invalidatePublic } from "@/lib/cache";

const ACTIVE_APPLICATION = ["SUBMITTED", "IN_REVIEW", "IN_PROCESS", "INTERVIEW"] as const;

/**
 * Cópia dos dados pessoais da conta (LGPD, art. 18, II e V).
 * Fica de fora só o que não é dado do titular ou é segredo: hash da senha, tokens e o binário da foto.
 */
export async function exportUserData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true,
      emailNotifications: true, termsAcceptedAt: true, termsVersion: true,
      image: { select: { mimeType: true, size: true, updatedAt: true } },
      candidate: {
        select: {
          headline: true, about: true, location: true, interestArea: true, workMode: true, objective: true,
          linkedinUrl: true, yearsExperience: true, updatedAt: true, postalCode: true, whatsapp: true, whatsappOptIn: true,
          skills: { select: { verifiedAt: true, skill: { select: { name: true } } } },
          skillChecks: { select: { skill: true, score: true, total: true, passed: true, startedAt: true, finishedAt: true }, orderBy: { startedAt: "desc" } },
          projects: { select: { title: true, description: true, url: true, school: true, teacherName: true, teacherEmail: true, validatedAt: true, validatorNote: true, createdAt: true } },
          checkins: { where: { role: "CANDIDATE" }, select: { day: true, score: true, wantsTalk: true, comment: true, answeredAt: true } },
          educations: { select: { institution: true, course: true, startYear: true, endYear: true } },
          experiences: { select: { company: true, role: true, description: true, startDate: true, endDate: true } },
          applications: {
            select: {
              status: true, coverNote: true, compatibility: true, createdAt: true, updatedAt: true, rejectReason: true, rejectSkills: true, hiredAt: true,
              job: { select: { title: true, company: { select: { name: true } } } },
              history: { select: { status: true, createdAt: true }, orderBy: { createdAt: "asc" } },
            },
            orderBy: { createdAt: "desc" },
          },
          savedJobs: { select: { createdAt: true, job: { select: { title: true, company: { select: { name: true } } } } } },
          views: { select: { count: true, firstAt: true, lastAt: true, company: { select: { name: true } } } },
        },
      },
      company: {
        select: {
          name: true, description: true, industry: true, website: true, location: true,
          cnpj: true, legalName: true, cnpjVerifiedAt: true, companySize: true, employees: true, apprentices: true, pcdEmployees: true,
          jobs: {
            select: {
              title: true, description: true, responsibilities: true, requirements: true, benefits: true, area: true,
              location: true, workMode: true, contractType: true, seniority: true, salaryMin: true, salaryMax: true,
              minYears: true, status: true, publishedAt: true, updatedAt: true, forApprentice: true, pcdOnly: true, postalCode: true,
              skills: { select: { skill: { select: { name: true } } } },
              _count: { select: { applications: true } },
            },
            orderBy: { publishedAt: "desc" },
          },
        },
      },
      notifications: { select: { title: true, body: true, read: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      supportTickets: {
        select: {
          subject: true, category: true, status: true, createdAt: true,
          messages: { select: { fromStaff: true, body: true, createdAt: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) throw new HttpError(404, "Conta não encontrada.");
  const reports = await db.jobReport.findMany({ where: { userId }, select: { reason: true, createdAt: true, job: { select: { title: true } } } });

  // Achata as tabelas de ligação para o arquivo ficar legível por uma pessoa.
  const skillNames = (s: { skill: { name: string }; verifiedAt?: Date | null }[]) => s.map((x) => (x.verifiedAt ? `${x.skill.name} (comprovada em ${x.verifiedAt.toISOString().slice(0, 10)})` : x.skill.name));
  return {
    exportadoEm: new Date().toISOString(),
    aviso: "Cópia dos seus dados pessoais no Nautiwork. A senha não é incluída porque só guardamos um hash dela.",
    conta: { ...user, candidate: undefined, company: undefined, notifications: undefined, supportTickets: undefined },
    perfilCandidato: user.candidate && { ...user.candidate, skills: skillNames(user.candidate.skills) },
    perfilEmpresa: user.company && {
      ...user.company,
      jobs: user.company.jobs.map(({ _count, skills, ...j }) => ({ ...j, skills: skillNames(skills), candidaturasRecebidas: _count.applications })),
    },
    notificacoes: user.notifications,
    pedidosDeSuporte: user.supportTickets,
    denunciasDeVagas: reports,
  };
}

/**
 * Exclui a conta e tudo o que depende dela (o banco apaga em cascata: perfil, foto,
 * candidaturas, vagas, notificações e pedidos de suporte).
 * Antes, se for empresa, avisa os candidatos com processo em andamento.
 */
export async function deleteAccount(userId: string, raw: unknown) {
  const { password } = deleteAccountSchema.parse(raw);
  const user = await db.user.findUnique({ where: { id: userId }, include: { company: { select: { id: true, name: true } } } });
  if (!user) throw new HttpError(404, "Conta não encontrada.");
  // Conta de administração é removida por outra pessoa da equipe, para nunca sobrar sistema sem admin.
  if (user.role === "ADMIN") throw new HttpError(403, "Contas de administrador não podem ser excluídas por aqui.");
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(400, "Senha incorreta.");

  // denúncias feitas pela pessoa saem junto (guardam quem denunciou)
  await db.jobReport.deleteMany({ where: { userId } });
  let affected: string[] = [];
  if (user.company) {
    const apps = await db.jobApplication.findMany({
      where: { job: { companyId: user.company.id }, status: { in: [...ACTIVE_APPLICATION] } },
      select: { candidate: { select: { userId: true } }, job: { select: { title: true } } },
    });
    affected = apps.map((a) => a.candidate.userId);
    const body = (title: string) => `A empresa ${user.company!.name} saiu do Nautiwork e a vaga "${title}" foi encerrada.`;
    if (apps.length) await db.notification.createMany({ data: apps.map((a) => ({ userId: a.candidate.userId, title: "Vaga encerrada", body: body(a.job.title), link: "/candidate/applications" })) });
    await db.user.delete({ where: { id: userId } });
    // Um e-mail por candidato basta, mesmo que ele tenha se candidatado a várias vagas da empresa.
    await emailNotify(affected, "Vaga encerrada", `A empresa ${user.company.name} saiu do Nautiwork e as vagas dela foram encerradas.`, "/candidate/applications");
  } else {
    await db.user.delete({ where: { id: userId } });
  }
  invalidatePublic();
  return { ok: true, candidatesNotified: new Set(affected).size };
}
