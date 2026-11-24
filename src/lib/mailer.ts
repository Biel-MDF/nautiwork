import { appendFile } from "node:fs/promises";

export type Mail = { to: string; subject: string; text: string; html: string; replyTo?: string };
export type MailResult = { sent: boolean; via: "resend" | "outbox" | "log" | "none" };

/**
 * Envio de e-mail transacional.
 * - Com RESEND_API_KEY e EMAIL_FROM: envia pela API HTTP do Resend (https://resend.com).
 * - Sem chave e com MAIL_DEV_OUTBOX: grava a mensagem em um arquivo JSONL (testes e desenvolvimento).
 * - Sem chave fora de produção: mostra a mensagem no console do servidor.
 * - Sem chave em produção: não envia e registra um aviso sem o conteúdo (o link não vaza em log).
 * Nunca lança erro: quem chama decide o que fazer quando o e-mail não sai.
 */
export async function sendMail(mail: Mail): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) console.error(`[mail] Resend respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return { sent: res.ok, via: "resend" };
    } catch (e) {
      console.error("[mail] falha ao chamar o Resend:", (e as Error).message);
      return { sent: false, via: "resend" };
    }
  }
  const outbox = process.env.MAIL_DEV_OUTBOX;
  if (outbox) {
    await appendFile(outbox, JSON.stringify({ ...mail, at: new Date().toISOString() }) + "\n");
    return { sent: true, via: "outbox" };
  }
  if (process.env.NODE_ENV !== "production") {
    console.info(`[mail] (desenvolvimento, sem envio real) para ${mail.to}: ${mail.subject}\n${mail.text}`);
    return { sent: true, via: "log" };
  }
  console.warn(`[mail] e-mail "${mail.subject}" não enviado: defina RESEND_API_KEY e EMAIL_FROM.`);
  return { sent: false, via: "none" };
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Monta um e-mail simples com um botão de ação. */
export function actionMail(to: string, subject: string, greeting: string, intro: string, cta: string, url: string, outro: string): Mail {
  const text = `${greeting}\n\n${intro}\n\n${cta}: ${url}\n\n${outro}\n\nNautiwork`;
  const html = `<div style="font-family:Arial,sans-serif;color:#0B2545;max-width:520px">
<p>${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#2F6FD0;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">${escapeHtml(cta)}</a></p>
<p style="font-size:13px">Se o botão não funcionar, copie este endereço: ${escapeHtml(url)}</p>
<p style="font-size:13px;color:#555">${escapeHtml(outro)}</p><p>Nautiwork</p></div>`;
  return { to, subject, text, html };
}
