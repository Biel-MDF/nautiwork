// Traduz falhas da IA em mensagens que a pessoa entende. Nada técnico vai para a tela.

type Shape = { type?: unknown; statusCode?: unknown; status?: unknown; message?: unknown; name?: unknown; cause?: unknown; lastError?: unknown; errors?: unknown };

/** Percorre o erro e os que ele embrulha (RetryError, cause), do mais externo ao mais interno. */
function chain(error: unknown): Shape[] {
  const out: Shape[] = [];
  let cur: unknown = error;
  for (let i = 0; i < 6 && cur && typeof cur === "object"; i++) {
    const e = cur as Shape;
    out.push(e);
    cur = e.lastError ?? (Array.isArray(e.errors) ? e.errors.at(-1) : undefined) ?? e.cause;
  }
  return out;
}

export type AssistantFailure = "credits" | "auth" | "rate" | "unavailable" | "generic";

export function classifyAssistantError(error: unknown): AssistantFailure {
  for (const e of chain(error)) {
    const status = Number(e.statusCode ?? e.status);
    const type = String(e.type ?? "");
    const text = `${String(e.name ?? "")} ${String(e.message ?? "")}`.toLowerCase();
    if (status === 402 || /insufficient|credit|crédito|balance|billing|payment required/.test(text)) return "credits";
    if (type === "authentication_error" || status === 401 || /authenticat|oidc|api key/.test(text)) return "auth";
    if (type === "rate_limit_exceeded" || status === 429) return "rate";
    if (type === "model_not_found" || type === "failed_dependency" || status === 503 || status === 504 || /timeout|timed out/.test(text)) return "unavailable";
  }
  return "generic";
}

export const assistantErrorText: Record<AssistantFailure, string> = {
  credits: "O assistente está sem créditos de IA no momento. Tente mais tarde ou use a busca de vagas em /jobs.",
  auth: "O assistente não está configurado neste ambiente. A busca de vagas em /jobs continua funcionando.",
  rate: "Muitas perguntas ao mesmo tempo. Espere alguns segundos e tente de novo.",
  unavailable: "O serviço de IA não respondeu agora. Tente de novo em instantes.",
  generic: "Não consegui responder agora. Tente de novo em instantes.",
};
