// Versão vigente dos Termos de Uso e da Política de Privacidade.
// Ao mudar o texto de forma relevante, troque a data: o cadastro grava qual versão foi aceita.
export const TERMS_VERSION = "2026-11-24";
export const TERMS_UPDATED_LABEL = "24 de novembro de 2026";

/** Contato do responsável pelos dados (encarregado/DPO). Usa o e-mail de suporte. */
export function privacyContact() {
  return process.env.SUPPORT_EMAIL || "ga14012009@gmail.com";
}
