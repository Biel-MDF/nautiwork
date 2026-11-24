import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, sniffImageType, validateImage } from "@/modules/images";
import { companyProfileSchema, educationSchema, experienceSchema, notificationsReadSchema, passwordChangeSchema } from "@/lib/validators";

const bytes = (...b: number[]) => new Uint8Array(b);

describe("validação de imagem", () => {
  it("reconhece PNG, JPEG e WebP pelos bytes iniciais", () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
  });
  it("recusa SVG, GIF e texto", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("GIF89a"))).toBeNull();
    expect(() => validateImage(new TextEncoder().encode("olá"))).toThrow(/Formato não aceito/);
  });
  it("recusa arquivo vazio e acima de 1 MB", () => {
    expect(() => validateImage(new Uint8Array())).toThrow(/Selecione/);
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1); big.set([0xff, 0xd8, 0xff]);
    expect(() => validateImage(big)).toThrow(/1 MB/);
  });
});

describe("validadores novos", () => {
  it("formação: conclusão não pode ser antes do início; vazio vira em andamento", () => {
    expect(educationSchema.safeParse({ institution: "UFPE", course: "SI", startYear: 2022, endYear: 2020 }).success).toBe(false);
    expect(educationSchema.parse({ institution: "UFPE", course: "SI", startYear: "2022", endYear: "" }).endYear).toBeUndefined();
  });
  it("experiência: início no futuro e fim antes do início são recusados", () => {
    expect(experienceSchema.safeParse({ company: "A", role: "B", startDate: "2999-01-01" }).success).toBe(false);
    expect(experienceSchema.safeParse({ company: "Aa", role: "Bb", startDate: "2023-05-01", endDate: "2022-01-01" }).success).toBe(false);
    expect(experienceSchema.parse({ company: "Aa", role: "Bb", startDate: "2023-05-01", description: "" }).description).toBeNull();
  });
  it("empresa: site precisa de http(s); campos vazios viram null", () => {
    expect(companyProfileSchema.safeParse({ name: "Empresa", website: "javascript:alert(1)" }).success).toBe(false);
    expect(companyProfileSchema.safeParse({ name: "Empresa", website: "exemplo.com" }).success).toBe(false);
    expect(companyProfileSchema.parse({ name: "Empresa", website: "", industry: "" })).toMatchObject({ website: null, industry: null });
  });
  it("senha nova segue as regras e precisa ser diferente da atual", () => {
    expect(passwordChangeSchema.safeParse({ currentPassword: "Senha1234", newPassword: "Senha1234" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: "x", newPassword: "curta1" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: "x", newPassword: "Outra1234" }).success).toBe(true);
  });
  it("notificações: aceita ids ou all, nada além disso", () => {
    expect(notificationsReadSchema.safeParse({ all: true }).success).toBe(true);
    expect(notificationsReadSchema.safeParse({ ids: ["a"] }).success).toBe(true);
    expect(notificationsReadSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(notificationsReadSchema.safeParse({}).success).toBe(false);
  });
});
