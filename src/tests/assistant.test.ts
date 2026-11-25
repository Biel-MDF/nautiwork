import { describe, expect, it } from "vitest";
import { classifyAssistantError } from "@/modules/assistant/errors";
import { internalHref, parseBlocks } from "@/components/assistant/markdown-parse";
import { assistantInstructions } from "@/modules/assistant/prompt";
import { DEFAULT_MODEL, assistantModel, toolsFor } from "@/modules/assistant/agent";
import { assistantAvailable } from "@/modules/assistant/config";

describe("erros do assistente", () => {
  it("reconhece falta de crédito, autenticação, limite e indisponibilidade, mesmo embrulhados", () => {
    expect(classifyAssistantError({ statusCode: 402, message: "Payment Required" })).toBe("credits");
    expect(classifyAssistantError({ name: "AI_RetryError", lastError: { message: "Insufficient funds. Add credits." } })).toBe("credits");
    expect(classifyAssistantError({ type: "authentication_error", statusCode: 401 })).toBe("auth");
    expect(classifyAssistantError({ statusCode: 403, message: "AI Gateway requires a valid credit card on file to service requests." })).toBe("billing");
    expect(classifyAssistantError({ statusCode: 403, message: "Free credits temporarily have restricted access due to abuse." })).toBe("billing");
    expect(classifyAssistantError(new Error("x", { cause: { type: "rate_limit_exceeded", statusCode: 429 } }))).toBe("rate");
    expect(classifyAssistantError({ type: "model_not_found" })).toBe("unavailable");
    expect(classifyAssistantError(new Error("algo inesperado"))).toBe("generic");
    expect(classifyAssistantError(null)).toBe("generic");
  });
});

describe("markdown das respostas", () => {
  it("separa parágrafos, títulos e listas", () => {
    expect(parseBlocks("Oi\n\n## Vagas\n- uma\n- duas\n1. primeira\n2) segunda\nfim")).toEqual([
      { kind: "p", text: "Oi" }, { kind: "h", text: "Vagas" }, { kind: "ul", items: ["uma", "duas"] },
      { kind: "ol", items: ["primeira", "segunda"] }, { kind: "p", text: "fim" },
    ]);
  });
  it("só aceita links internos do site", () => {
    expect(internalHref("/jobs/abc")).toBe("/jobs/abc");
    expect(internalHref("/company/applications?job=x")).toBe("/company/applications?job=x");
    expect(internalHref("//evil.test/x")).toBeNull();
    expect(internalHref("https://evil.test")).toBeNull();
    expect(internalHref("javascript:alert(1)")).toBeNull();
  });
});

describe("instruções e escopo", () => {
  it("muda conforme o perfil e usa só o primeiro nome", () => {
    const day = new Date("2026-11-25T12:00:00Z");
    expect(assistantInstructions(null, null, day)).toContain("VISITANTE");
    const c = assistantInstructions({ id: "1", role: "CANDIDATE" }, "[Demo] Ana Costa", day);
    expect(c).toContain("CANDIDATO");
    expect(c).toContain("primeiro nome da pessoa é Ana.");
    expect(c).not.toContain("Costa");
    expect(c).toContain("2026-11-25");
    expect(assistantInstructions({ id: "1", role: "COMPANY" }, "Marés", day)).toContain("EMPRESA");
  });
  it("cada perfil só recebe as próprias ferramentas", () => {
    expect(toolsFor(null)).toEqual(["buscar_vagas", "ver_vaga", "listar_empresas"]);
    expect(toolsFor({ id: "1", role: "ADMIN" })).toEqual(["buscar_vagas", "ver_vaga", "listar_empresas"]);
    expect(toolsFor({ id: "1", role: "CANDIDATE" })).toContain("minhas_candidaturas");
    expect(toolsFor({ id: "1", role: "CANDIDATE" })).not.toContain("vagas_da_empresa");
    expect(toolsFor({ id: "1", role: "COMPANY" })).toContain("vagas_da_empresa");
    expect(toolsFor({ id: "1", role: "COMPANY" })).not.toContain("minhas_candidaturas");
  });
  it("modelo configurável e disponibilidade conforme o ambiente", () => {
    const env = { ...process.env };
    try {
      delete process.env.AI_GATEWAY_MODEL;
      expect(assistantModel()).toBe(DEFAULT_MODEL);
      process.env.AI_GATEWAY_MODEL = "openai/gpt-5.6-luna";
      expect(assistantModel()).toBe("openai/gpt-5.6-luna");
      for (const k of ["AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "VERCEL", "ASSISTANT_MOCK"]) delete process.env[k];
      expect(assistantAvailable()).toBe(false);
      process.env.ASSISTANT_MOCK = "1";
      expect(assistantAvailable()).toBe(true);
      process.env.VERCEL_ENV = "production";
      expect(assistantAvailable()).toBe(false); // o modelo de roteiro nunca vale em produção
    } finally { process.env = env; }
  });
});
