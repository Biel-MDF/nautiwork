import { HttpError } from "./errors";

/**
 * Endereço público usado nos links dos e-mails.
 * Em produção vem só de APP_URL: montar o link a partir do cabeçalho Host da requisição
 * permitiria que alguém forjasse o Host e recebesse o token de redefinição de outra pessoa.
 * Em desenvolvimento, sem APP_URL, usa a origem da própria requisição.
 */
export function appUrl(req: Request) {
  const configured = process.env.APP_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new HttpError(500, "APP_URL não configurada no servidor.");
  return new URL(req.url).origin;
}
