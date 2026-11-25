import { describe, expect, it } from "vitest";
import { deleteAccountSchema, jobSchema, registerSchema } from "@/lib/validators";

describe("registerSchema", () => {
  it("normaliza e-mail e aceita candidato válido", () => {
    const r = registerSchema.parse({ name: "Ana Souza", email: " ANA@Mail.com ", password: "senha1234", role: "CANDIDATE", acceptTerms: true });
    expect(r.email).toBe("ana@mail.com");
  });
  it("rejeita senha fraca e role ADMIN", () => {
    expect(registerSchema.safeParse({ name: "Ana", email: "a@a.com", password: "12345678", role: "CANDIDATE" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Ana", email: "a@a.com", password: "senha1234", role: "ADMIN" }).success).toBe(false);
  });
  it("exige nome da empresa para role COMPANY", () => {
    expect(registerSchema.safeParse({ name: "Rui", email: "r@r.com", password: "senha1234", role: "COMPANY", acceptTerms: true }).success).toBe(false);
  });
  it("exige o aceite dos termos", () => {
    const base = { name: "Ana Souza", email: "a@a.com", password: "senha1234", role: "CANDIDATE" };
    expect(registerSchema.safeParse(base).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, acceptTerms: "on" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, acceptTerms: true }).success).toBe(true);
  });
});

describe("deleteAccountSchema", () => {
  it("só aceita a palavra EXCLUIR, sem diferenciar maiúsculas", () => {
    expect(deleteAccountSchema.safeParse({ password: "x", confirm: " excluir " }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ password: "x", confirm: "sim" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ password: "", confirm: "EXCLUIR" }).success).toBe(false);
  });
});

describe("jobSchema", () => {
  const base = { title: "Dev Front", description: "Descrição com mais de vinte caracteres.", area: "TI", location: "Recife", workMode: "REMOTE", contractType: "CLT", seniority: "MID" };
  it("aceita vaga válida", () => expect(jobSchema.safeParse(base).success).toBe(true));
  it("rejeita salário mínimo maior que máximo", () =>
    expect(jobSchema.safeParse({ ...base, salaryMin: 9000, salaryMax: 5000 }).success).toBe(false));
});
