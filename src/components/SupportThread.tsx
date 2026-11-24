import { UserAvatar } from "./UserAvatar";
import { LogoMark } from "./Logo";
import { supportCategoryLabel, supportStatusLabel } from "@/modules/support.service";

type Msg = { id: string; body: string; fromStaff: boolean; createdAt: Date; author: { id: string; name: string; image: { updatedAt: Date } | null } };
const plain = (n: string) => n.replace(/\[[^\]]*\]\s*/g, "");
const when = (d: Date) => d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export const statusTone = {
  OPEN: "border-tide/40 bg-tide/10 text-deep", ANSWERED: "border-reef/40 bg-reef/10 text-reef", CLOSED: "border-mist bg-transparent text-abyss/60",
} as const;

export function TicketBadge({ status }: { status: keyof typeof statusTone }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone[status]}`}>{supportStatusLabel[status]}</span>;
}
export const categoryLabel = supportCategoryLabel;

/** Conversa do pedido: mensagens da equipe à esquerda com a marca; da pessoa à direita com o avatar. */
export function SupportThread({ messages, viewerIsStaff }: { messages: Msg[]; viewerIsStaff: boolean }) {
  return (
    <ol className="space-y-5" aria-label="Mensagens do pedido">
      {messages.map((m) => {
        const mine = m.fromStaff === viewerIsStaff;
        return (
          <li key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
            <div className="mt-1 shrink-0">
              {m.fromStaff
                ? <span className="flex h-9 w-9 items-center justify-center rounded-full border border-mist bg-fossa"><LogoMark size={22} /></span>
                : <UserAvatar userId={m.author.id} name={m.author.name} imageVersion={m.author.image ? m.author.image.updatedAt.getTime() : null} size={36} />}
            </div>
            <div className={`min-w-0 max-w-[85%] sm:max-w-[75%] ${mine ? "text-right" : ""}`}>
              <p className="mb-1 text-xs text-abyss/60">
                <span className="font-semibold text-abyss/85">{m.fromStaff ? "Equipe Nautiwork" : plain(m.author.name)}</span>
                <span className="mx-1.5" aria-hidden="true">/</span><time dateTime={m.createdAt.toISOString()} className="tabular">{when(m.createdAt)}</time>
              </p>
              <div className={`inline-block whitespace-pre-line break-words rounded-panel border px-4 py-3 text-left text-sm leading-relaxed
                ${m.fromStaff ? "border-reef/30 bg-reef/[0.07]" : "border-mist bg-foam"} ${mine ? "rounded-tr-[6px]" : "rounded-tl-[6px]"}`}>
                {m.body}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
