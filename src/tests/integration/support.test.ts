import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { addMessage, createTicket, setTicketStatus } from "@/modules/support.service";
import { updatePreferences } from "@/modules/account.service";
import { emailNotify } from "@/modules/notify";

const outbox = path.join(mkdtempSync(path.join(tmpdir(), "nautiwork-sup-")), "outbox.jsonl");
let seq = 0;
const mails = () => { try { return readFileSync(outbox, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };

async function makeUser(role: "CANDIDATE" | "COMPANY" | "ADMIN" = "CANDIDATE", emailNotifications = true) {
  return db.user.create({ data: { name: `Pessoa ${seq}`, email: `sup-${Date.now().toString(36)}-${seq++}@test.local`, role, emailNotifications,
    passwordHash: await bcrypt.hash("Senha1234", 4) } });
}
async function expectHttp(p: Promise<unknown>, status: number) {
  const err = await p.then(() => null, (e) => e);
  expect(err).toBeInstanceOf(HttpError);
  expect((err as HttpError).status).toBe(status);
}
const ticketInput = { subject: "Não consigo enviar foto", category: "BUG", message: "Ao enviar a foto de perfil aparece um erro." };

let admin: Awaited<ReturnType<typeof makeUser>>;
beforeAll(async () => {
  writeFileSync(outbox, "");
  process.env.MAIL_DEV_OUTBOX = outbox;
  process.env.SUPPORT_EMAIL = "suporte@exemplo.test";
  process.env.APP_URL = "https://app.exemplo.test";
  delete process.env.RESEND_API_KEY;
  admin = await makeUser("ADMIN");
});
afterAll(async () => { delete process.env.MAIL_DEV_OUTBOX; delete process.env.SUPPORT_EMAIL; await db.$disconnect(); });

describe("pedidos de suporte", () => {
  it("abre o pedido com a primeira mensagem, avisa os admins e manda e-mail ao suporte com resposta direta ao usuário", async () => {
    const u = await makeUser();
    const t = await createTicket(u.id, ticketInput);
    const full = await db.supportTicket.findUniqueOrThrow({ where: { id: t.id }, include: { messages: true } });
    expect(full.status).toBe("OPEN");
    expect(full.messages).toHaveLength(1);
    expect(await db.notification.count({ where: { userId: admin.id, title: "Suporte" } })).toBeGreaterThan(0);
    const m = mails().find((x) => x.to === "suporte@exemplo.test" && x.subject.includes(ticketInput.subject));
    expect(m).toBeTruthy();
    expect(m.replyTo).toBe(u.email);
    expect(m.text).toContain(`https://app.exemplo.test/admin/support/${t.id}`);
  });

  it("valida assunto, categoria e mensagem", async () => {
    const u = await makeUser();
    await expect(createTicket(u.id, { subject: "oi", category: "BUG", message: "curta" })).rejects.toThrow();
    await expect(createTicket(u.id, { ...ticketInput, category: "QUALQUER" })).rejects.toThrow();
  });

  it("limita a 5 pedidos em aberto por pessoa", async () => {
    const u = await makeUser();
    for (let i = 0; i < 5; i++) await createTicket(u.id, ticketInput);
    await expectHttp(createTicket(u.id, ticketInput), 429);
  });

  it("resposta do admin marca como respondido e avisa o usuário; mensagem do usuário reabre", async () => {
    const u = await makeUser();
    const t = await createTicket(u.id, ticketInput);
    await addMessage(admin.id, "ADMIN", t.id, { body: "Tente com uma imagem PNG de até 1 MB." });
    expect((await db.supportTicket.findUniqueOrThrow({ where: { id: t.id } })).status).toBe("ANSWERED");
    expect(await db.notification.count({ where: { userId: u.id, title: "Suporte respondeu" } })).toBe(1);
    expect(mails().some((x) => x.to === u.email && x.subject === "Suporte respondeu")).toBe(true);
    await addMessage(u.id, "CANDIDATE", t.id, { body: "Funcionou, obrigado." });
    expect((await db.supportTicket.findUniqueOrThrow({ where: { id: t.id } })).status).toBe("OPEN");
    const msgs = await db.supportMessage.findMany({ where: { ticketId: t.id }, orderBy: { createdAt: "asc" } });
    expect(msgs.map((m) => m.fromStaff)).toEqual([false, true, false]);
  });

  it("ninguém além do dono e dos admins acessa o pedido (404)", async () => {
    const owner = await makeUser();
    const other = await makeUser("COMPANY");
    const t = await createTicket(owner.id, ticketInput);
    await expectHttp(addMessage(other.id, "COMPANY", t.id, { body: "invasão" }), 404);
    await expectHttp(setTicketStatus(other.id, "COMPANY", t.id, { status: "CLOSED" }), 404);
    expect(await db.supportMessage.count({ where: { ticketId: t.id } })).toBe(1);
  });

  it("usuário só encerra o próprio pedido; reabrir é só mandando mensagem", async () => {
    const u = await makeUser();
    const t = await createTicket(u.id, ticketInput);
    await expectHttp(setTicketStatus(u.id, "CANDIDATE", t.id, { status: "ANSWERED" }), 403);
    await setTicketStatus(u.id, "CANDIDATE", t.id, { status: "CLOSED" });
    await expectHttp(addMessage(admin.id, "ADMIN", t.id, { body: "resposta" }), 409);
    await addMessage(u.id, "CANDIDATE", t.id, { body: "Voltou a acontecer." });
    expect((await db.supportTicket.findUniqueOrThrow({ where: { id: t.id } })).status).toBe("OPEN");
  });
});

describe("preferência de e-mail", () => {
  it("quem desliga as notificações por e-mail não recebe; quem deixa ligado recebe", async () => {
    const on = await makeUser();
    const off = await makeUser();
    await updatePreferences(off.id, { emailNotifications: false });
    await emailNotify([on.id, off.id], "Teste de preferência", "corpo", "/");
    const got = mails().filter((m) => m.subject === "Teste de preferência").map((m) => m.to);
    expect(got).toContain(on.email);
    expect(got).not.toContain(off.email);
  });

  it("recusa valor que não é verdadeiro/falso", async () => {
    const u = await makeUser();
    await expect(updatePreferences(u.id, { emailNotifications: "sim" })).rejects.toThrow();
  });
});
