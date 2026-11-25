import { handle, HttpError } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { exportUserData } from "@/modules/privacy.service";

// Baixa um arquivo JSON com os dados pessoais da conta (LGPD, art. 18).
export const GET = handle(async () => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  if (!(await rateLimit(`export:${userId}`, 10, 60 * 60_000))) throw new HttpError(429, "Muitos pedidos de exportação. Tente daqui a uma hora.");
  const data = await exportUserData(userId);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="nautiwork-meus-dados-${day}.json"`,
      "cache-control": "no-store",
    },
  });
});
