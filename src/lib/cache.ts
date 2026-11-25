import { revalidateTag, unstable_cache } from "next/cache";

// Cache dos dados públicos (vagas, empresas, contadores): iguais para todo mundo,
// então não precisam ir ao banco a cada visita. Duram até 60 s e são renovados na hora
// em que uma vaga, empresa ou conta muda (invalidatePublic).
export const PUBLIC_TAG = "public";

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
/** O cache guarda JSON: datas voltam como texto. Isto as transforma de novo em Date. */
export function revive<T>(v: T): T {
  if (v instanceof Date) return v;
  if (typeof v === "string" && ISO.test(v)) return new Date(v) as T;
  if (Array.isArray(v)) return v.map(revive) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, revive(x)])) as T;
  return v;
}

export function cachedPublic<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, revalidate = 60) {
  const c = unstable_cache(fn, [key], { tags: [PUBLIC_TAG], revalidate });
  return async (...args: A): Promise<R> => revive(await c(...args));
}

/** Chamar depois de qualquer mudança que apareça nas páginas públicas. */
export function invalidatePublic() {
  try { revalidateTag(PUBLIC_TAG); } catch { /* fora de uma requisição do Next (ex.: testes): não há cache */ }
}
