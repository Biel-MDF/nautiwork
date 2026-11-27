// CNPJ: dígitos verificadores conferidos aqui; situação e razão social consultadas na
// BrasilAPI (pública e gratuita), que repassa os dados da Receita Federal.

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function isValidCnpj(raw: string) {
  const c = onlyDigits(raw);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (base: string) => {
    const weights = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(c.slice(0, 12));
  const d2 = dv(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`);
}

export const formatCnpj = (c: string) => onlyDigits(c).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

export type CnpjLookup = { ok: true; legalName: string; active: boolean; status: string } | { ok: false; reason: "not_found" | "unavailable" };

export async function lookupCnpj(cnpj: string, fetcher: typeof fetch = fetch): Promise<CnpjLookup> {
  try {
    const r = await fetcher(`https://brasilapi.com.br/api/cnpj/v1/${onlyDigits(cnpj)}`, { signal: AbortSignal.timeout(6000), headers: { accept: "application/json" } });
    if (r.status === 404 || r.status === 400) return { ok: false, reason: "not_found" };
    if (!r.ok) return { ok: false, reason: "unavailable" };
    const j = await r.json() as { razao_social?: string; descricao_situacao_cadastral?: string };
    const status = String(j.descricao_situacao_cadastral ?? "").toUpperCase();
    return { ok: true, legalName: String(j.razao_social ?? "").slice(0, 160), active: status === "ATIVA", status };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
