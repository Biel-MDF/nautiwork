import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";
import { actionMail, sendMail } from "@/lib/mailer";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("limite de tentativas", () => {
  it("em memória: bloqueia depois do máximo e libera quando a janela acaba", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(await rateLimit(key, 3, 50)).toBe(true);
    expect(await rateLimit(key, 3, 50)).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(await rateLimit(key, 3, 50)).toBe(true);
  });

  it("com Upstash: usa o contador do Redis", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://exemplo.upstash.io/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "tkn");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([{ result: "OK" }, { result: 6 }])));
    vi.stubGlobal("fetch", fetchMock);
    expect(await rateLimit("k", 5, 1000)).toBe(false);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://exemplo.upstash.io/pipeline");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tkn");
    expect(JSON.parse(String(init.body))).toEqual([["SET", "rl:k", "0", "PX", "1000", "NX"], ["INCR", "rl:k"]]);
  });

  it("com Upstash fora do ar: cai para a memória em vez de bloquear todo mundo", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://exemplo.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "tkn");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("rede"); }));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await rateLimit(`f-${Math.random()}`, 1, 1000)).toBe(true);
  });
});

describe("envio de e-mail", () => {
  const mail = actionMail("a@b.test", "Assunto", "Olá", "Texto", "Abrir", "https://x.test/?token=abc", "Fim");

  it("com chave do Resend: chama a API com o formato esperado", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_teste");
    vi.stubEnv("EMAIL_FROM", "Nautiwork <no@x.test>");
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendMail(mail)).toEqual({ sent: true, via: "resend" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_teste");
    expect(JSON.parse(String(init.body))).toMatchObject({ from: "Nautiwork <no@x.test>", to: ["a@b.test"], subject: "Assunto" });
  });

  it("Resend recusando: devolve sent=false sem lançar erro", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_teste");
    vi.stubEnv("EMAIL_FROM", "x@x.test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("domínio não verificado", { status: 403 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendMail(mail)).toEqual({ sent: false, via: "resend" });
  });

  it("em produção sem chave: não envia e não escreve o link no log", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("MAIL_DEV_OUTBOX", "");
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await sendMail(mail)).toEqual({ sent: false, via: "none" });
    expect(String(warn.mock.calls[0][0])).not.toContain("token=");
  });
});
