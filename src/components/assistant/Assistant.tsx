"use client";
// Assistente do Nautiwork: botão flutuante que abre a conversa (painel no computador,
// tela cheia no celular). A conversa e a biblioteca de IA só carregam quando o painel abre.
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { AssistantUIMessage } from "@/modules/assistant/agent";
import type { Who } from "./Conversation";

const Conversation = dynamic(() => import("./Conversation"), { ssr: false, loading: () => <Loading /> });
const loadStored = () => import("./Conversation").then((m) => m.load);

function SonarIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 13.5c0-4.4 3.6-8 8-8 2.2 0 4.2.9 5.7 2.4" />
      <path d="M7.5 13.5a4.5 4.5 0 0 1 7.6-3.3" />
      <circle cx="12" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
      <path d="M12 13.5 18.5 7" />
      <path d="M4.5 18.5h15" />
    </svg>
  );
}
const Close = () => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;

function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="flex items-center gap-2 text-sm text-abyss/70">
        <span className="h-2.5 w-2.5 rounded-full bg-tide motion-safe:animate-pulse" aria-hidden="true" />Abrindo…
      </p>
    </div>
  );
}

/* ---------- botão e painel ---------- */

export function Assistant({ raised = false }: { raised?: boolean }) {
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState<Who | null>(null);
  const [initial, setInitial] = useState<AssistantUIMessage[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const pathname = usePathname();
  // a página da vaga tem a barra de candidatura fixa embaixo no celular
  const overBar = /^\/jobs\/[^/]+$/.test(pathname ?? "");

  const close = useCallback(() => { setOpen(false); requestAnimationFrame(() => launcher.current?.focus()); }, []);

  // ao abrir, descobre quem está conversando (perfil pode ter mudado desde a última vez)
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoadError(false); setWho(null); setInitial(null);
    fetch("/api/assistant", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(async (w: Who) => { const load = await loadStored(); if (!alive) return; setWho(w); setInitial(load(`${w.role}:${w.firstName ?? ""}`)); })
      .catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    // no celular o painel cobre a tela: trava a rolagem da página por baixo
    const small = window.matchMedia("(max-width: 639px)").matches;
    const prev = document.body.style.overflow;
    if (small) document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, close]);

  const lift = raised ? "bottom-32" : overBar ? "max-lg:bottom-24 bottom-5" : "bottom-5";
  // na página do assistente a conversa já está aberta em tela cheia
  if (pathname?.startsWith("/assistente")) return null;

  return (
    <div className="print:hidden">
      {!open && (
        <button ref={launcher} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
          className={`btn-primary fixed right-4 z-40 h-14 gap-2 rounded-full px-4 shadow-[0_14px_36px_-10px_rgb(0_0_0/var(--shade-a))] sm:right-6 ${lift}`}>
          <SonarIcon />
          <span className="hidden font-semibold sm:inline">Assistente</span>
          <span className="sr-only sm:hidden">Abrir assistente</span>
        </button>
      )}
      {open && (
        <section role="dialog" aria-labelledby={titleId}
          className={`fixed inset-0 z-50 flex flex-col bg-casco text-abyss motion-safe:animate-menu sm:inset-auto sm:right-6 sm:h-[min(680px,calc(100vh-7rem))] sm:w-[400px] sm:rounded-panel sm:border sm:border-mist sm:shadow-[0_24px_60px_-12px_rgb(0_0_0/var(--shade-a))] ${raised ? "sm:bottom-32" : "sm:bottom-6"}`}>
          {who && initial ? (
            who.available ? <Conversation key={`${who.role}:${who.firstName ?? ""}`} who={who} initial={initial} onClose={close} titleId={titleId} />
              : <Unavailable titleId={titleId} onClose={close} text="O assistente não está disponível neste ambiente. A busca de vagas continua funcionando." />
          ) : loadError ? (
            <Unavailable titleId={titleId} onClose={close} text="Não consegui abrir o assistente. Confira sua conexão e tente de novo." />
          ) : (
            <><h2 id={titleId} className="sr-only">Assistente Nautiwork</h2><Loading /></>
          )}
        </section>
      )}
    </div>
  );
}

function Unavailable({ text, onClose, titleId }: { text: string; onClose: () => void; titleId: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-mist px-4 py-3">
        <h2 id={titleId} className="font-display text-base font-semibold">Assistente Nautiwork</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-abyss/80 hover:bg-foam" aria-label="Fechar assistente"><Close /></button>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-abyss/80">{text}</p>
        <Link href="/jobs" onClick={onClose} className="btn-ghost">Ver vagas</Link>
      </div>
    </div>
  );
}
