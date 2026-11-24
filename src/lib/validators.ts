import { z } from "zod";

const password = z.string().min(8, "Mínimo de 8 caracteres").max(72)
  .regex(/[A-Za-z]/, "Inclua letras").regex(/\d/, "Inclua números");
const nameField = z.string().trim().min(2, "Informe seu nome").max(100);

export const registerSchema = z.object({
  name: nameField,
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password,
  role: z.enum(["CANDIDATE", "COMPANY"]),
  companyName: z.string().trim().min(2).max(120).optional(),
}).refine((d) => d.role !== "COMPANY" || !!d.companyName, {
  path: ["companyName"], message: "Informe o nome da empresa",
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const jobSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20, "Descreva a vaga com mais detalhes").max(8000),
  responsibilities: z.string().max(4000).optional(),
  requirements: z.string().max(4000).optional(),
  benefits: z.string().max(2000).optional(),
  area: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(120),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
  contractType: z.enum(["CLT", "PJ", "INTERNSHIP", "TEMPORARY"]),
  seniority: z.enum(["INTERN", "JUNIOR", "MID", "SENIOR", "LEAD"]),
  salaryMin: z.coerce.number().int().positive().optional(),
  salaryMax: z.coerce.number().int().positive().optional(),
  minYears: z.coerce.number().int().min(0).max(40).default(0),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
}).refine((d) => !d.salaryMin || !d.salaryMax || d.salaryMin <= d.salaryMax, {
  path: ["salaryMax"], message: "O máximo deve ser maior que o mínimo",
});

export const jobStatusSchema = z.object({ status: z.enum(["ACTIVE", "PAUSED", "CLOSED"]) });

export const applySchema = z.object({
  jobId: z.string().min(1),
  coverNote: z.string().max(2000).optional(),
});

export const statusSchema = z.object({
  status: z.enum(["IN_REVIEW", "IN_PROCESS", "INTERVIEW", "APPROVED", "REJECTED"]),
});

export const profileSchema = z.object({
  headline: z.string().trim().max(120).optional(),
  about: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(100).optional(),
  interestArea: z.string().trim().max(80).optional(),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional(),
  objective: z.string().trim().max(500).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).default(0),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
});

export const jobSearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  area: z.string().trim().max(80).optional(),
  location: z.string().trim().max(80).optional(),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional(),
  contractType: z.enum(["CLT", "PJ", "INTERNSHIP", "TEMPORARY"]).optional(),
  minSalary: z.coerce.number().int().positive().optional(),
  days: z.coerce.number().int().positive().max(365).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

// Campo de texto opcional: "" vira null para permitir apagar o valor salvo.
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const thisYear = () => new Date().getFullYear();

export const educationSchema = z.object({
  institution: z.string().trim().min(2, "Informe a instituição").max(120),
  course: z.string().trim().min(2, "Informe o curso").max(120),
  startYear: z.coerce.number().int().min(1950, "Ano inválido").max(thisYear() + 1, "Ano inválido"),
  endYear: z.preprocess((v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().int().min(1950).max(thisYear() + 8, "Ano inválido").optional()),
}).refine((d) => d.endYear === undefined || d.endYear >= d.startYear, {
  path: ["endYear"], message: "A conclusão não pode ser antes do início",
});

const monthDate = z.coerce.date({ error: "Data inválida" });
export const experienceSchema = z.object({
  company: z.string().trim().min(2, "Informe a empresa").max(120),
  role: z.string().trim().min(2, "Informe o cargo").max(120),
  description: optionalText(2000),
  startDate: monthDate.refine((d) => d <= new Date(), "O início não pode estar no futuro"),
  endDate: z.preprocess((v) => (v === "" || v === null ? undefined : v), monthDate.optional()),
}).refine((d) => !d.endDate || d.endDate >= d.startDate, {
  path: ["endDate"], message: "O fim não pode ser antes do início",
});

export const companyProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa").max(120),
  description: optionalText(4000),
  industry: optionalText(80),
  location: optionalText(120),
  website: z.string().trim().max(200).optional()
    .refine((v) => !v || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "Use um endereço começando com http:// ou https://")
    .transform((v) => (v ? v : null)),
});

export const accountSchema = z.object({ name: nameField });

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: password,
}).refine((d) => d.currentPassword !== d.newPassword, {
  path: ["newPassword"], message: "A nova senha deve ser diferente da atual",
});

export const notificationsReadSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.string().min(1)).min(1).max(100) }),
]);

const tokenField = z.string().trim().min(20, "Link inválido").max(200, "Link inválido");
export const tokenSchema = z.object({ token: tokenField });
export const forgotPasswordSchema = z.object({ email: z.string().trim().toLowerCase().email("E-mail inválido") });
export const resetPasswordSchema = z.object({ token: tokenField, newPassword: password });

export const supportCategories = ["ACCOUNT", "JOBS", "APPLICATIONS", "BUG", "OTHER"] as const;
export const supportTicketSchema = z.object({
  subject: z.string().trim().min(5, "Descreva o assunto em pelo menos 5 caracteres").max(120),
  category: z.enum(supportCategories, { error: "Escolha uma categoria" }),
  message: z.string().trim().min(10, "Explique o problema em pelo menos 10 caracteres").max(4000),
});
export const supportMessageSchema = z.object({ body: z.string().trim().min(2, "Escreva a mensagem").max(4000) });
export const supportStatusSchema = z.object({ status: z.enum(["OPEN", "ANSWERED", "CLOSED"]) });
export const preferencesSchema = z.object({ emailNotifications: z.boolean() });
