import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { requestPasswordReset, resetPassword, sendVerificationEmail, verifyEmail } from "@/modules/auth-tokens.service";
import { changePassword } from "@/modules/account.service";

const outbox = path.join(mkdtempSync(path.join(tmpdir(), "nautiwork-mail-")), "outbox.jsonl");
const BASE = "https://app.exemplo.test";
let seq = 0;

beforeAll(() => { process.env.MAIL_DEV_OUTBOX = outbox; delete process.env.RESEND_API_KEY; });
afterAll(async () => { delete process.env.MAIL_DEV_OUTBOX; await db.$disconnect(); });

function mails(to: string) {
  try { return readFileSync(outbox, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((m) => m.to === to); }
  catch { return []; }
}
const tokenFrom = (text: string) => /token=([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? "";

async function makeUser(active = true) {
  return db.user.create({ data: { name: "Pessoa Teste", email: `mail-${Date.now().toString(36)}-${seq++}@test.local`, role: "CANDIDATE",
    active, passwordHash: await bcrypt.hash("Senha1234", 4), candidate: { create: {} } } });
}
async function expectHttp(p: Promise<unknown>, status: number) {
  const err = await p.then(() => null, (e) => e);
  expect(err).toBeInstanceOf(HttpError);
  expect((err as HttpError).status).toBe(status);
}

describe("redefinição de senha", () => {
  it("envia link com o endereço configurado, troca a senha, derruba sessões e só funciona uma vez", async () => {
    const u = await makeUser();
    await requestPasswordReset({ email: u.email.toUpperCase() }, BASE);
    const [mail] = mails(u.email);
    expect(mail.text).toContain(`${BASE}/reset-password?token=`);
    const token = tokenFrom(mail.text);
    // Só o hash fica no banco.
    expect(await db.authToken.count({ where: { tokenHash: token } })).toBe(0);

    await resetPassword({ token, newPassword: "NovaSenha123" });
    const after = await db.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(await bcrypt.compare("NovaSenha123", after.passwordHash)).toBe(true);
    expect(after.sessionVersion).toBe(u.sessionVersion + 1);
    await expectHttp(resetPassword({ token, newPassword: "Outra12345" }), 400);
  });

  it("não revela se o e-mail existe e não envia nada para conta inexistente ou desativada", async () => {
    const inactive = await makeUser(false);
    await expect(requestPasswordReset({ email: "ninguem@test.local" }, BASE)).resolves.toEqual({ ok: true });
    await expect(requestPasswordReset({ email: inactive.email }, BASE)).resolves.toEqual({ ok: true });
    expect(mails("ninguem@test.local")).toHaveLength(0);
    expect(mails(inactive.email)).toHaveLength(0);
  });

  it("pedido novo invalida o link anterior", async () => {
    const u = await makeUser();
    await requestPasswordReset({ email: u.email }, BASE);
    await requestPasswordReset({ email: u.email }, BASE);
    const [first, second] = mails(u.email).map((m) => tokenFrom(m.text));
    await expectHttp(resetPassword({ token: first, newPassword: "NovaSenha123" }), 400);
    await expect(resetPassword({ token: second, newPassword: "NovaSenha123" })).resolves.toEqual({ ok: true });
  });

  it("recusa link expirado e token de outro tipo", async () => {
    const u = await makeUser();
    await requestPasswordReset({ email: u.email }, BASE);
    const token = tokenFrom(mails(u.email)[0].text);
    await expectHttp(verifyEmail({ token }), 400); // token de senha não confirma e-mail
    await db.authToken.updateMany({ where: { userId: u.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expectHttp(resetPassword({ token, newPassword: "NovaSenha123" }), 400);
  });

  it("dois usos simultâneos do mesmo link: só um passa", async () => {
    const u = await makeUser();
    await requestPasswordReset({ email: u.email }, BASE);
    const token = tokenFrom(mails(u.email)[0].text);
    const r = await Promise.allSettled([resetPassword({ token, newPassword: "NovaSenha123" }), resetPassword({ token, newPassword: "Outra12345" })]);
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  });
});

describe("confirmação de e-mail", () => {
  it("confirma com o link e não reenvia para quem já confirmou", async () => {
    const u = await makeUser();
    const sent = await sendVerificationEmail(u.id, BASE);
    expect(sent).toEqual({ sent: true, alreadyVerified: false });
    const token = tokenFrom(mails(u.email)[0].text);
    expect(mails(u.email)[0].text).toContain(`${BASE}/verify-email?token=`);
    await verifyEmail({ token });
    expect((await db.user.findUniqueOrThrow({ where: { id: u.id } })).emailVerified).not.toBeNull();
    expect(await sendVerificationEmail(u.id, BASE)).toEqual({ sent: false, alreadyVerified: true });
    await expectHttp(verifyEmail({ token }), 400);
  });

  it("nome com HTML é escapado no corpo do e-mail", async () => {
    const u = await makeUser();
    await db.user.update({ where: { id: u.id }, data: { name: "<script>x</script>" } });
    await sendVerificationEmail(u.id, BASE);
    const [m] = mails(u.email);
    expect(m.html).not.toContain("<script>");
    expect(m.html).toContain("&lt;script&gt;");
  });
});

describe("troca de senha logado", () => {
  it("sobe a versão de sessão (desconecta as sessões abertas)", async () => {
    const u = await makeUser();
    await changePassword(u.id, { currentPassword: "Senha1234", newPassword: "NovaSenha123" });
    expect((await db.user.findUniqueOrThrow({ where: { id: u.id } })).sessionVersion).toBe(1);
  });
});

// Arquivo vazio para que a leitura não falhe antes do primeiro e-mail.
writeFileSync(outbox, "");
