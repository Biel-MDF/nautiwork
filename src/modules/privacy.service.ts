import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { deleteAccountSchema } from "@/lib/validators";
import { emailNotify } from "./notify";

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
          linkedinUrl: true, yearsExperience: true, updatedAt: true,
          skills: { select: { skill: { select: { name: true } } } },
          educations: { select: { institution: true, course: true, startYear: true, endYear: true } },
          experiences: { select: { company: true, role: true, description: true, startDate: true, endDate: true } },
          applications: {
            select: {
              status: true, coverNote: true, compatibility: true, createdAt: true, updatedAt: true,
              job: { select: { title: true, company: { select: { name: true } } } },
              history: { select: { status: true, createdAt: true }, orderBy: { createdAt: "asc" } },
            },
            orderBy: { createdAt: "desc" },
          },
          savedJobs: { select: { createdAt: true, job: { select: { title: true, company: { select: { name: true } } } } } },
        },
      },
      company: {
        select: {
          name: true, description: true, industry: true, website: true, location: true,
          jobs: {
            select: {
              title: true, description: true, responsibilities: true, requirements: true, benefits: true, area: true,
              location: true, workMode: true, contractType: true, seniority: true, salaryMin: true, salaryMax: true,
              minYears: true, status: true, publishedAt: true, updatedAt: true,
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

  // Achata as tabelas de ligação para o arquivo ficar legível por uma pessoa.
  const skillNames = (s: { skill: { name: string } }[]) => s.map((x) => x.skill.name);
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

  let affected: string[] = [];
  if (user.company) {
    const apps = await db.jobApplication.findMany({
      where: { job: { companyId: user.company.id }, status: { in: [...ACTIVE_APPLICATION] } },
      select: { candidate: { select: { userId: true } }, job: { select: { title: true } } },
    });
    affected = apps.map((a) => a.candidate.userId);
    const body = (title: string) => `A empresa ${user.company!.name} saiu do Nautiwork e a vaga "${title}" foi encerrada.`;
    if (apps.length) await db.notification.createMany({ data: apps.map((a) => ({ userId: a.candidate.userId, title: "Vaga encerrada", body: body(a.job.title) })) });
    await db.user.delete({ where: { id: userId } });
    // Um e-mail por candidato basta, mesmo que ele tenha se candidatado a várias vagas da empresa.
    await emailNotify(affected, "Vaga encerrada", `A empresa ${user.company.name} saiu do Nautiwork e as vagas dela foram encerradas.`, "/candidate/applications");
  } else {
    await db.user.delete({ where: { id: userId } });
  }
  return { ok: true, candidatesNotified: new Set(affected).size };
}
