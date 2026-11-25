import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

// Erros de Server Components, rotas de API e middleware vão para o Sentry.
export const onRequestError = Sentry.captureRequestError;
