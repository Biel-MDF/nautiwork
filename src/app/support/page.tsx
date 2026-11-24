import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { TicketBadge, categoryLabel } from "@/components/SupportThread";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suporte — Nautiwork" };

export default async function SupportList() {
  const user = await requirePageUser();
  if (user.role === "ADMIN") redirect("/admin/support");
  const tickets = await db.supportTicket.findMany({
    where: { userId: user.id }, orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, _count: { select: { messages: true } } },
  });
  const open = tickets.filter((t) => t.status !== "CLOSED").length;
  return (
    <Shell role={user.role} title="">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-[28px]">Suporte</h1>
          <p className="mt-1.5 max-w-[56ch] text-abyss/75">Fale com a equipe do Nautiwork. Cada pedido vira uma conversa, e você recebe um aviso quando houver resposta.</p>
        </div>
        <Link href="/support/new" className="btn-primary">Abrir pedido</Link>
      </div>
      {tickets.length === 0 ? (
        <Empty title="Nenhum pedido ainda" hint="Problema para entrar, dúvida sobre uma vaga ou algo que não funcionou? Abra um pedido e a equipe responde por aqui." href="/support/new" cta="Abrir o primeiro pedido" />
      ) : (
        <>
          <p className="mb-3 text-sm text-abyss/65"><span className="tabular font-semibold text-abyss">{open}</span> {open === 1 ? "pedido em andamento" : "pedidos em andamento"} de 5 permitidos ao mesmo tempo.</p>
          <ul className="divide-y divide-mist overflow-hidden rounded-panel border border-mist bg-casco">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link href={`/support/${t.id}`} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-foam/50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.subject}</span>
                    <span className="mt-0.5 block truncate text-sm text-abyss/65">{t.messages[0]?.fromStaff ? "Equipe: " : "Você: "}{t.messages[0]?.body}</span>
                  </span>
                  <span className="flex shrink-0 flex-wrap items-center gap-3 text-sm text-abyss/60">
                    <span className="chip">{categoryLabel[t.category]}</span>
                    <TicketBadge status={t.status} />
                    <time className="tabular" dateTime={t.updatedAt.toISOString()}>{t.updatedAt.toLocaleDateString("pt-BR")}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Shell>
  );
}
