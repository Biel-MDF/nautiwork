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

/** Ligado por padrão (modelo gratuito). Para desligar: ASSISTANT_ENABLED=0 no ambiente. */
export function assistantEnabled() {
  return assistantMockEnabled() || process.env.ASSISTANT_ENABLED !== "0";
}

/** Há credencial para a AI Gateway? Na Vercel, o token OIDC é fornecido pela plataforma. */
export function assistantAvailable() {
  return assistantMockEnabled() || !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL);
}
