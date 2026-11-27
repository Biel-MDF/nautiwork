import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
// Cabeçalhos de segurança em todas as respostas. A CSP aqui só trava o que não quebra nada:
// ninguém pode pôr o site dentro de um quadro (golpe de clique na tela de login), formulários
// só enviam para o próprio site e nenhum plugin (object/embed) é carregado.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // O projeto não usa next/image. Com o otimizador desligado, /_next/image responde 404,
  // o que fecha falhas do Next 14 nesse endpoint que só foram corrigidas na linha 15.5.x.
  images: { unoptimized: true },
  experimental: {
    // Páginas visitadas há menos de 30 s (e as pré-carregadas pelo menu) abrem sem ir ao servidor.
    // Toda ação que muda dados chama router.refresh(), que descarta esse cache.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

// Monitoramento de erros (Sentry). Sem NEXT_PUBLIC_SENTRY_DSN o SDK fica desligado.
// Com SENTRY_AUTH_TOKEN, SENTRY_ORG e SENTRY_PROJECT, o build envia os source maps
// para os erros aparecerem com o código original.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  telemetry: false,
  // Só queremos os erros: tira do pacote do navegador o código de desempenho e de depuração.
  bundleSizeOptimizations: { excludeDebugStatements: true, excludeTracing: true },
});
