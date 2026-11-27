import Link from "next/link";
import { requirePageUser } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { NewTicketForm } from "@/components/support-forms";

export const metadata = { title: "Novo pedido de suporte — Nautiwork" };

export default async function NewTicket() {
  const user = await requirePageUser();
  return (
    <Shell role={user.role} title="">
      <Link href="/support" className="tap text-sm text-tide hover:underline">Voltar para os pedidos</Link>
      <h1 className="mb-2 mt-3 text-2xl font-semibold sm:text-[28px]">Abrir pedido de suporte</h1>
      <p className="mb-7 max-w-[60ch] text-abyss/75">Quanto mais detalhes, mais rápida a solução. A resposta aparece neste site e, se você deixou ligado nas Configurações, também por e-mail.</p>
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <NewTicketForm />
        <aside className="space-y-4 text-sm">
          <div className="card"><h2 className="font-semibold">Ajuda a resolver mais rápido</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-abyss/75">
              <li>Em qual página aconteceu</li><li>O que você clicou antes</li><li>A mensagem de erro, se apareceu</li>
            </ul></div>
          <div className="card"><h2 className="font-semibold">Sua conta</h2><p className="mt-2 text-abyss/75">O pedido sai em nome de <span className="text-abyss">{user.email}</span>. A equipe vê o seu tipo de conta, mas nunca a sua senha.</p></div>
        </aside>
      </div>
    </Shell>
  );
}
