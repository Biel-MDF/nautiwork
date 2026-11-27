"use client";
// Na página da vaga: aviso antigolpe, denúncia e compartilhamento pelo WhatsApp.
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

const REASONS = {
  SCAM: "Pede dinheiro, Pix ou dados bancários",
  FAKE: "Parece uma vaga falsa ou que não existe",
  DISCRIMINATION: "Tem conteúdo discriminatório",
  WRONG_INFO: "Informações erradas (salário, local, requisitos)",
  OTHER: "Outro motivo",
} as const;

export function JobSafety({ jobId, title, loggedIn, own }: { jobId: string; title: string; loggedIn: boolean; own: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{ busy?: boolean; error?: string; done?: string }>({});
  const share = `https://wa.me/?text=${encodeURIComponent(`Vaga no Nautiwork: ${title} — ${typeof window === "undefined" ? "" : window.location.origin}/jobs/${jobId}`)}`;
  return (
    <section className="card space-y-3 text-sm" aria-labelledby={`safe-${jobId}`}>
      <h2 id={`safe-${jobId}`} className="font-semibold">Proteja-se de golpes</h2>
      <p className="text-abyss/80">Processo seletivo de verdade não cobra nada. Nunca pague taxa, curso, exame ou kit, nem passe senha ou dados bancários antes de assinar contrato. <Link href="/primeiro-emprego#golpes" className="text-tide hover:underline">Como reconhecer golpe</Link></p>
      <div className="flex flex-wrap gap-2">
        <a href={share} target="_blank" rel="noopener noreferrer" className="btn-ghost min-h-[40px] px-3 text-sm">Compartilhar no WhatsApp</a>
        {!own && (loggedIn
          ? <button type="button" className="btn-ghost min-h-[40px] px-3 text-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>Denunciar vaga</button>
          : <Link href={`/login?next=/jobs/${jobId}`} className="btn-ghost min-h-[40px] px-3 text-sm">Entrar para denunciar</Link>)}
      </div>
      {open && !state.done && (
        <form className="space-y-2" onSubmit={async (e) => {
          e.preventDefault(); setState({ busy: true });
          const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
          const r = await api<{ held: boolean }>("POST", `/api/jobs/${jobId}/report`, { reason: f.reason, details: f.details || undefined });
          setState(r.ok ? { done: "Denúncia enviada. A equipe vai analisar; com três denúncias a vaga sai do ar até a revisão." } : { error: (r.data as { error?: string }).error ?? "Não foi possível enviar." });
        }}>
          <fieldset className="space-y-1.5"><legend className="mb-1 font-medium">O que há de errado?</legend>
            {Object.entries(REASONS).map(([k, v], i) => <label key={k} className="flex min-h-[36px] cursor-pointer items-center gap-2"><input type="radio" name="reason" value={k} defaultChecked={i === 0} className="h-4 w-4 accent-tide" />{v}</label>)}
          </fieldset>
          <label className="label" htmlFor={`det-${jobId}`}>Detalhes (opcional)</label>
          <textarea id={`det-${jobId}`} name="details" maxLength={500} rows={2} className="input py-2" />
          <button className="btn-primary min-h-[40px]" disabled={state.busy}>{state.busy ? "Enviando..." : "Enviar denúncia"}</button>
          {state.error && <p role="alert" className="text-coral">{state.error}</p>}
        </form>
      )}
      {state.done && <p role="status" className="text-abyss/80">{state.done}</p>}
    </section>
  );
}
