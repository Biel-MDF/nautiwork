/**
 * Limite de tentativas por chave (janela fixa).
 * - Com UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN (ou KV_REST_API_URL e KV_REST_API_TOKEN,
 *   os nomes que a integração do Upstash no Marketplace da Vercel cria): contador no Redis, pela
 *   API REST, compartilhado entre todas as instâncias (o que importa na Vercel).
 * - Sem essas variáveis, ou se o Redis falhar: contador em memória, por instância.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || cur.resetAt <= now) { hits.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  cur.count++;
  return cur.count <= max;
}

async function redisLimit(url: string, token: string, key: string, max: number, windowMs: number) {
  // SET ... NX cria a chave com prazo só na primeira vez; INCR conta a tentativa.
  const res = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([["SET", `rl:${key}`, "0", "PX", String(windowMs), "NX"], ["INCR", `rl:${key}`]]),
    signal: AbortSignal.timeout(2_000),
  });
  if (!res.ok) throw new Error(`Upstash respondeu ${res.status}`);
  const data = (await res.json()) as { result?: number; error?: string }[];
  const count = data[1]?.result;
  if (typeof count !== "number") throw new Error(data[1]?.error ?? "resposta inesperada do Upstash");
  return count <= max;
}

let warned = false;

export async function rateLimit(key: string, max = 10, windowMs = 60_000): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!(url && token) && process.env.VERCEL_ENV === "production" && !warned) {
    warned = true;
    console.warn("[rate-limit] Sem Redis em produção: o limite vale só por instância. Instale o Upstash pelo Marketplace da Vercel.");
  }
  if (url && token) {
    try { return await redisLimit(url, token, key, max, windowMs); }
    catch (e) { console.warn("[rate-limit] Redis indisponível, usando memória:", (e as Error).message); }
  }
  return memoryLimit(key, max, windowMs);
}
