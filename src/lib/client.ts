"use client";
export type ApiResult<T = unknown> = { ok: boolean; data: T & { error?: string; fields?: Record<string, string[]> } };
export async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Sem conexão. Verifique sua internet e tente de novo." } as never };
  }
}
