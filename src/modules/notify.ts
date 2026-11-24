import { db } from "@/lib/db";
import { actionMail, sendMail } from "@/lib/mailer";

/**
 * Envia por e-mail uma notificação que já foi gravada no site, só para quem deixou
 * "Receber notificações por e-mail" ligado nas Configurações e tem a conta ativa.
 * Roda depois da transação e nunca derruba a operação principal: e-mail é um extra.
 */
export async function emailNotify(userIds: string[], title: string, body: string, path = "/") {
  if (userIds.length === 0) return;
  try {
    const users = await db.user.findMany({
      where: { id: { in: [...new Set(userIds)] }, active: true, emailNotifications: true },
      select: { email: true, name: true },
    });
    const base = (process.env.APP_URL ?? "").replace(/\/+$/, "");
    await Promise.all(users.map((u) => sendMail(actionMail(u.email, title, `Olá, ${u.name.replace(/\[[^\]]*\]\s*/g, "")}.`, body,
      "Abrir no Nautiwork", `${base}${path}`,
      "Você recebe este e-mail porque ativou as notificações por e-mail. Para desligar, abra Configurações > Notificações."))));
  } catch (e) {
    console.error("[notify] falha ao enviar notificações por e-mail:", (e as Error).message);
  }
}
