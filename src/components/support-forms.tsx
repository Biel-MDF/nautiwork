"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Msg } from "./forms";

const categories = [
  ["ACCOUNT", "Conta e acesso"], ["JOBS", "Vagas"], ["APPLICATIONS", "Candidaturas"], ["BUG", "Erro no site"], ["OTHER", "Outro assunto"],
] as const;

export function NewTicketForm() {
  const router = useRouter();
  const [s, setS] = useState<{ busy?: boolean; error?: string; fields?: Record<string, string[]> }>({});
  const [len, setLen] = useState(0);
  return (
    <form className="card space-y-5 p-6 sm:p-8" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const r = await api<{ id: string }>("POST", "/api/support", Object.fromEntries(new FormData(e.currentTarget)));
      if (!r.ok) return setS({ error: r.data.fields ? "Revise os campos destacados." : r.data.error, fields: r.data.fields });
      router.push(`/support/${r.data.id}?novo=1`); router.refresh();
    }}>
      <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
        <div><label className="label" htmlFor="sp-subject">Assunto</label>
          <input id="sp-subject" name="subject" required minLength={5} maxLength={120} className="input" placeholder="Ex.: Não consigo enviar minha foto" />
          <Msg error={s.fields?.subject?.[0]} /></div>
        <div><label className="label" htmlFor="sp-category">Categoria</label>
          <select id="sp-category" name="category" required defaultValue="" className="input">
            <option value="" disabled>Escolha</option>
            {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Msg error={s.fields?.category?.[0]} /></div>
      </div>
      <div>
        <label className="label" htmlFor="sp-message">O que aconteceu?</label>
        <textarea id="sp-message" name="message" required minLength={10} maxLength={4000} rows={7} className="input"
          aria-describedby="sp-message-hint" onChange={(e) => setLen(e.target.value.length)}
          placeholder="Conte o que você estava tentando fazer, o que esperava e o que apareceu na tela." />
        <p id="sp-message-hint" className="mt-1.5 flex justify-between gap-3 text-xs text-abyss/60">
          <span>Não envie senhas. A equipe nunca pede sua senha.</span><span className="tabular">{len}/4000</span>
        </p>
        <Msg error={s.fields?.message?.[0]} />
      </div>
      <Msg error={s.error} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Enviando..." : "Enviar pedido"}</button>
    </form>
  );
}

export function ReplyForm({ ticketId, staff, closed }: { ticketId: string; staff: boolean; closed: boolean }) {
  const router = useRouter();
  const [s, setS] = useState<{ busy?: boolean; error?: string }>({});
  if (closed && staff) return <p className="text-sm text-abyss/70">Pedido encerrado. Reabra pelo controle de status para responder.</p>;
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const form = e.currentTarget;
      const r = await api("POST", `/api/support/${ticketId}/messages`, { body: new FormData(form).get("body") });
      if (!r.ok) return setS({ error: r.data.fields?.body?.[0] ?? r.data.error });
      form.reset(); setS({}); router.refresh();
    }}>
      <label className="label" htmlFor="reply">{staff ? "Responder ao usuário" : closed ? "Escreva para reabrir o pedido" : "Responder"}</label>
      <textarea id="reply" name="body" required minLength={2} maxLength={4000} rows={4} className="input" />
      <Msg error={s.error} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Enviando..." : staff ? "Enviar resposta" : closed ? "Reabrir com esta mensagem" : "Enviar mensagem"}</button>
    </form>
  );
}

export function TicketStatusControl({ ticketId, status, staff }: { ticketId: string; status: "OPEN" | "ANSWERED" | "CLOSED"; staff: boolean }) {
  const router = useRouter();
  const [s, setS] = useState<{ busy?: boolean; error?: string }>({});
  const set = async (next: string) => {
    setS({ busy: true });
    const r = await api("PATCH", `/api/support/${ticketId}`, { status: next });
    if (!r.ok) return setS({ error: r.data.error });
    setS({}); router.refresh();
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== "CLOSED" && <button type="button" className="btn-ghost" disabled={s.busy} onClick={() => set("CLOSED")}>{staff ? "Encerrar pedido" : "Marcar como resolvido"}</button>}
        {staff && status === "CLOSED" && <button type="button" className="btn-ghost" disabled={s.busy} onClick={() => set("OPEN")}>Reabrir pedido</button>}
      </div>
      <Msg error={s.error} />
    </div>
  );
}
