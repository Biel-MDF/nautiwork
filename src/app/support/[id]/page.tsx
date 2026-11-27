import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { SupportThread, TicketBadge, categoryLabel } from "@/components/SupportThread";
import { ReplyForm, TicketStatusControl } from "@/components/support-forms";

export const dynamic = "force-dynamic";

export default async function TicketPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ novo?: string }> }) {
  const user = await requirePageUser();
  const { id } = await props.params;
  const { novo } = await props.searchParams;
  const t = await db.supportTicket.findUnique({ where: { id }, include: {
    messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true, image: { select: { updatedAt: true } } } } } } } });
  // Pedido de outra pessoa responde como inexistente.
  if (!t || t.userId !== user.id) notFound();
  return (
    <Shell role={user.role} title="">
      <Link href="/support" className="tap text-sm text-tide hover:underline">Voltar para os pedidos</Link>
      {novo && <p role="status" className="mt-4 rounded-control border border-reef/30 bg-reef/10 p-3 text-sm text-reef">Pedido enviado. A equipe foi avisada e a resposta vai aparecer aqui.</p>}
      <div className="mb-7 mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold sm:text-[28px]">{t.subject}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-abyss/65"><span className="chip">{categoryLabel[t.category]}</span><TicketBadge status={t.status} />
            <span>Aberto em {t.createdAt.toLocaleDateString("pt-BR")}</span></p>
        </div>
        <TicketStatusControl ticketId={t.id} status={t.status} staff={false} />
      </div>
      <div className="card p-5 sm:p-7"><SupportThread messages={t.messages} viewerIsStaff={false} /></div>
      <div className="card mt-5 p-5 sm:p-7"><ReplyForm ticketId={t.id} staff={false} closed={t.status === "CLOSED"} /></div>
    </Shell>
  );
}
