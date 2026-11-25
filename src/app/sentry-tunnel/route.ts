// Túnel do Sentry: o navegador envia os erros para o próprio site, que repassa ao Sentry.
// Evita que bloqueadores de anúncio descartem os relatórios e não repassa cookies.
// Na Vercel o Sentry geraria este arquivo em .js no build; tê-lo em TypeScript mantém a checagem de tipos.
export { POST } from "@sentry/nextjs/tunnel";
