import * as Sentry from "@sentry/nextjs";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";

// Só para conferir a instalação do Sentry: um admin chama esta rota e o erro deve aparecer no painel do Sentry.
export const GET = handle(async () => {
  await requireRole("ADMIN");
  const configured = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
  try {
    throw new Error(`Erro de teste do Nautiwork (${new Date().toISOString()})`);
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.flush(3000);
  }
  return Response.json({ ok: true, sentryConfigurado: configured,
    mensagem: configured ? "Erro de teste enviado. Confira em Issues no painel do Sentry." : "Sentry desligado: falta NEXT_PUBLIC_SENTRY_DSN." });
});
