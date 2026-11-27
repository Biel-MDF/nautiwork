import { NextResponse, after } from "next/server";
import { currentUser, viewMode } from "@/lib/rbac";
import { maybeSweep } from "@/modules/hiring";
import { splitDemo } from "@/lib/display";

export const dynamic = "force-dynamic";

/**
 * Quem está navegando: o menu do topo pede isto no navegador. Assim as páginas públicas não
 * precisam ler a sessão no servidor e podem ser montadas de antemão e servidas pela CDN.
 */
export async function GET() {
  // validade das vagas, avisos de "sem retorno" e acompanhamentos: rodam depois da resposta
  after(() => maybeSweep());
  const [user, mode] = await Promise.all([currentUser(), viewMode()]);
  return NextResponse.json({
    user: user ? {
      id: user.id, name: user.name, email: user.email, role: user.role,
      imageVersion: user.image ? user.image.updatedAt.getTime() : null, emailNotifications: user.emailNotifications,
    } : null,
    mode,
    as: mode && mode !== "visitor" && user ? `${splitDemo(user.name).name}, conta de demonstração` : null,
  }, { headers: { "cache-control": "private, no-store" } });
}
