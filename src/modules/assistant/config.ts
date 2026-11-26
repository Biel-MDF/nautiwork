// Limites e disponibilidade do assistente (usados pela rota e pelos testes).

export const ASSISTANT_LIMITS = {
  messages: 40, // mensagens aceitas no corpo
  history: 16, // mensagens que vão para o modelo (as mais recentes)
  userText: 1000, // caracteres da pergunta
  bodyBytes: 120_000,
};

/** Ambiente de teste: modelo de roteiro, sem rede. Nunca em produção. */
export function assistantMockEnabled() {
  return process.env.ASSISTANT_MOCK === "1" && process.env.VERCEL_ENV !== "production";
}

/**
 * O assistente está fora do ar por decisão do projeto (a AI Gateway exige crédito pago).
 * Volta só com ASSISTANT_ENABLED=1 no ambiente, ou com o modelo de roteiro nos testes.
 */
export function assistantEnabled() {
  return assistantMockEnabled() || process.env.ASSISTANT_ENABLED === "1";
}

/** Há credencial para a AI Gateway? Na Vercel, o token OIDC é fornecido pela plataforma. */
export function assistantAvailable() {
  return assistantMockEnabled() || !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL);
}
