import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { TicketBadge, categoryLabel } from "@/components/SupportThread";
import { UserAvatar } from "@/components/UserAvatar";

export const dynamic = "force-dynamic";
const filters = [["OPEN", "Aguardando resposta"], ["ANSWERED", "Respondidos"], ["CLOSED", "Encerrados"], ["ALL", "Todos"]] as const;
const roleLabel = { CANDIDATE: "Candidato", COMPANY: "Empresa", ADMIN: "Admin" } as const;

export default async function AdminSupport(props: { searchParams: Promise<{ status?: string }> }) {
  await requirePageRole("ADMIN");
  const { status: raw } = await props.searchParams;
  const status = filters.some(([k]) => k === raw) ? raw! : "OPEN";
  const [tickets, counts] = await Promise.all([
    db.supportTicket.findMany({
      where: status === "ALL" ? {} : { status: status as "OPEN" | "ANSWERED" | "CLOSED" },
      // fila: quem espera há mais tempo aparece primeiro
      orderBy: { updatedAt: status === "OPEN" ? "asc" : "desc" }, take: 200,
      include: { user: { select: { id: true, name: true, email: true, role: true, image: { select: { updatedAt: true } } } }, _count: { select: { messages: true } } },
    }),
    db.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (k: string) => k === "ALL" ? counts.reduce((n, c) => n + c._count._all, 0) : counts.find((c) => c.status === k)?._count._all ?? 0;
  return (
    <Shell role="ADMIN" title="Suporte">
      <nav aria-label="Filtrar pedidos" className="mb-5 flex flex-wrap gap-2">
        {filters.map(([k, l]) => (
          <Link key={k} href={`/admin/support?status=${k}`} scroll={false} aria-current={status === k ? "page" : undefined}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm ${status === k ? "border-tide/60 bg-foam text-abyss" : "border-mist text-abyss/70 hover:text-abyss"}`}>
            {l}<span className="tabular rounded-full bg-fossa px-2 text-xs">{count(k)}</span>
          </Link>))}
      </nav>
      {tickets.length === 0 ? <Empty title="Nada por aqui" hint={status === "OPEN" ? "Nenhum pedido esperando resposta." : "Nenhum pedido neste filtro."} /> : (
        <ul className="divide-y divide-mist overflow-hidden rounded-panel border border-mist bg-casco">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/support/${t.id}`} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 transition-colors hover:bg-foam/50">
                <UserAvatar userId={t.user.id} name={t.user.name} imageVersion={t.user.image ? t.user.image.updatedAt.getTime() : null} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.subject}</span>
                  <span className="block truncate text-sm text-abyss/65">{t.user.name.replace(/\[[^\]]*\]\s*/g, "")}, {roleLabel[t.user.role]}, {t.user.email}</span>
                </span>
                <span className="flex flex-wrap items-center gap-3 text-sm text-abyss/60">
                  <span className="chip">{categoryLabel[t.category]}</span><TicketBadge status={t.status} />
                  <span className="tabular">{t._count.messages} {t._count.messages === 1 ? "mensagem" : "mensagens"}</span>
                  <time className="tabular" dateTime={t.updatedAt.toISOString()}>{t.updatedAt.toLocaleDateString("pt-BR")}</time>
                </span>
              </Link>
            </li>))}
        </ul>)}
    </Shell>
  );
}
