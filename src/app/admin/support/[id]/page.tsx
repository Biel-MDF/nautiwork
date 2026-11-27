import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { SupportThread, TicketBadge, categoryLabel } from "@/components/SupportThread";
import { ReplyForm, TicketStatusControl } from "@/components/support-forms";
import { UserAvatar } from "@/components/UserAvatar";

export const dynamic = "force-dynamic";
const roleLabel = { CANDIDATE: "Candidato", COMPANY: "Empresa", ADMIN: "Admin" } as const;

export default async function AdminTicket(props: { params: Promise<{ id: string }> }) {
  await requirePageRole("ADMIN");
  const { id } = await props.params;
  const t = await db.supportTicket.findUnique({ where: { id }, include: {
    user: { select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, image: { select: { updatedAt: true } } } },
    messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true, image: { select: { updatedAt: true } } } } } } } });
  if (!t) notFound();
  const others = await db.supportTicket.count({ where: { userId: t.userId, id: { not: t.id } } });
  return (
    <Shell role="ADMIN" title="">
      <Link href="/admin/support" className="tap text-sm text-tide hover:underline">Voltar para a fila</Link>
      <div className="mb-7 mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold sm:text-[28px]">{t.subject}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-abyss/65"><span className="chip">{categoryLabel[t.category]}</span><TicketBadge status={t.status} /><span>Aberto em {t.createdAt.toLocaleDateString("pt-BR")}</span></p>
        </div>
        <TicketStatusControl ticketId={t.id} status={t.status} staff />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-5">
          <div className="card p-5 sm:p-7"><SupportThread messages={t.messages} viewerIsStaff /></div>
          <div className="card p-5 sm:p-7"><ReplyForm ticketId={t.id} staff closed={t.status === "CLOSED"} /></div>
        </div>
        <aside className="card h-fit space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <UserAvatar userId={t.user.id} name={t.user.name} imageVersion={t.user.image ? t.user.image.updatedAt.getTime() : null} size={44} />
            <div className="min-w-0"><p className="truncate font-semibold">{t.user.name.replace(/\[[^\]]*\]\s*/g, "")}</p><p className="truncate text-abyss/65">{t.user.email}</p></div>
          </div>
          <dl className="space-y-2 border-t border-mist pt-3">
            <div className="flex justify-between gap-3"><dt className="text-abyss/60">Tipo de conta</dt><dd>{roleLabel[t.user.role]}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-abyss/60">Situação</dt><dd>{t.user.active ? "Ativa" : "Desativada"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-abyss/60">Cliente desde</dt><dd className="tabular">{t.user.createdAt.toLocaleDateString("pt-BR")}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-abyss/60">Outros pedidos</dt><dd className="tabular">{others}</dd></div>
          </dl>
        </aside>
      </div>
    </Shell>
  );
}
