// Configuração comum do Sentry para servidor, edge e navegador.
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  // Só erros, sem rastreamento de desempenho: cabe com folga no plano gratuito.
  // LGPD: não envia IP, cookies nem cabeçalhos com dados pessoais.
  sendDefaultPii: false,
};
