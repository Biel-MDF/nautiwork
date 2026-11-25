import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimitBackend } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Saúde do serviço: banco e contador de tentativas. Só diz se funcionam, nunca endereços ou chaves.
export async function GET() {
  const [database, rateLimit] = await Promise.all([
    db.$queryRaw`SELECT 1`.then(() => "ok", () => "falhou"),
    rateLimitBackend(),
  ]);
  const ok = database === "ok" && rateLimit !== "redis-indisponivel";
  return NextResponse.json({ ok, database, rateLimit }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
