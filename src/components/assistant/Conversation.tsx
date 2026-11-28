"use client";
import type { AssistantMode } from "@/modules/assistant/modes";
// Conversa do assistente. Carregada só quando o painel abre, para não pesar nas páginas.
// A conversa fica só nesta aba (sessionStorage), não no banco.
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssistantUIMessage } from "@/modules/assistant/agent";
import { Markdown } from "./Markdown";

export type Role = "VISITOR" | "CANDIDATE" | "COMPANY" | "ADMIN";
export type Who = { available: boolean; role: Role; firstName: string | null };

const STORE = "nw-assistant:v1";
const MAX_TEXT = 1000;

const SUGGESTIONS: Record<Role, string[]> = {
  VISITOR: ["Quais vagas de estágio estão abertas?", "Vagas remotas que não pedem experiência", "Como a compatibilidade é calculada?", "Como crio uma conta de empresa?"],
  CANDIDATE: ["Quais vagas combinam mais comigo?", "O que falta no meu perfil?", "Como estão minhas candidaturas?", "O que posso fazer para aumentar minha compatibilidade?"],
  COMPANY: ["Como estão as candidaturas das minhas vagas?", "Quais candidaturas são mais compatíveis?", "Me ajude a escrever uma vaga de estágio", "O que falta no perfil da empresa?"],
  ADMIN: ["Quantas vagas de tecnologia estão abertas?", "Quais empresas têm mais vagas?", "Como a compatibilidade é calculada?"],
};

/** Título, apresentação e sugestões de cada modo (o de carreira usa as do perfil, acima). */
const MODES: Record<Exclude<AssistantMode, "carreira">, { title: string; sub: string; intro: string; suggestions: string[]; placeholder: string }> = {
  curriculo: { title: "Revisão de currículo", sub: "Pontos fortes e o que melhorar", intro: "Eu leio o seu currículo no Nautiwork e aponto o que melhorar, com exemplos usando só o que você já escreveu.",
    suggestions: ["Revise meu currículo", "Como escrevo um bom 'sobre mim'?", "Quais habilidades devo comprovar com prova?"], placeholder: "Peça a revisão ou tire uma dúvida…" },
  entrevista: { title: "Simulado de entrevista", sub: "Uma pergunta por vez, com retorno", intro: "Eu faço 5 perguntas como numa entrevista de verdade e comento cada resposta. Escolha a vaga ou peça para eu sugerir uma.",
    suggestions: ["Começar o simulado", "Simulado para uma vaga de estágio em tecnologia", "Como responder 'fale sobre você'?"], placeholder: "Sua resposta…" },
  empresa: { title: "Ajuda para empresas", sub: "Anúncio da vaga e resumo de candidatos", intro: "Eu escrevo o anúncio da vaga com você e resumo os candidatos de cada vaga. A decisão é sempre da empresa.",
    suggestions: ["Escreva um anúncio de vaga de estágio em atendimento", "Resuma os candidatos da minha vaga mais recente", "Quem vale chamar para entrevista?"], placeholder: "Peça um anúncio ou um resumo…" },
};

export function load(owner: string, mode: AssistantMode = "carreira"): AssistantUIMessage[] {
  try {
    const s = JSON.parse(sessionStorage.getItem(mode === "carreira" ? STORE : `${STORE}:${mode}`) ?? "null");
    return s?.owner === owner && Array.isArray(s.messages) ? s.messages : [];
  } catch { return []; }
}

/** Mensagem de erro amigável, venha ela do corpo JSON da rota ou do fluxo. */
function errorText(e: Error | undefined) {
  if (!e) return null;
  try { const j = JSON.parse(e.message); if (typeof j?.error === "string") return j.error; } catch { /* texto puro */ }
  return e.message && e.message.length < 300 && !/fetch|network|typeerror/i.test(e.message)
    ? e.message : "Não consegui falar com o assistente. Confira sua conexão e tente de novo.";
}

/* ---------- ícones ---------- */

export function SonarIcon({ className = "h-6 w-6" }: { className?: string }) {
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
export const Close = () => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
const Send = () => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
const NewChat = () => <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5" /></svg>;
const Stop = () => <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>;

/* ---------- resultados das ferramentas ---------- */

type Part = AssistantUIMessage["parts"][number];

function Score({ value }: { value: number }) {
  const tone = value >= 60 ? "border-reef/50 bg-reef/10 text-reef" : value >= 30 ? "border-tide/50 bg-tide/10 text-deep" : "border-mist bg-foam text-abyss/80";
  return <span className={`tabular shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`} title="Compatibilidade calculada pelas regras da plataforma">{value}%</span>;
}

export function Working({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm text-abyss/70">
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-tide/60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-tide" />
      </span>
      {children}
    </p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-abyss/60">{children}</p>;
}

function ToolView({ part, onNavigate }: { part: Part; onNavigate: () => void }) {
  if (!part.type.startsWith("tool-") || !("state" in part)) return null;
  const busy = part.state === "input-streaming" || part.state === "input-available";
  const failed = part.state === "output-error";

  switch (part.type) {
    case "tool-buscar_vagas": {
      if (busy) return <Working>Buscando vagas…</Working>;
      if (failed || part.state !== "output-available") return <Note>Não consegui buscar as vagas agora.</Note>;
      const out = part.output;
      if (out.vagas.length === 0) return <Note>Nenhuma vaga ativa com esses filtros.</Note>;
      return (
        <div className="space-y-2">
          <ul className="space-y-2" aria-label="Vagas encontradas">
            {out.vagas.map((v) => (
              <li key={v.id}>
                <Link href={v.link} onClick={onNavigate}
                  className="group block rounded-xl border border-mist bg-field/60 px-3 py-2.5 transition hover:border-tide/60 focus-visible:border-tide">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block font-semibold leading-snug text-abyss group-hover:text-tide">{v.titulo}</span>
                      <span className="block truncate text-xs text-abyss/70">{v.empresa}{v.demonstracao ? " (demo)" : ""} · {v.cidade} · {v.modalidade}</span>
                    </span>
                    {typeof v.compatibilidade === "number" && <Score value={v.compatibilidade} />}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-abyss/70">
                    <span>{v.contrato} · {v.senioridade}</span>
                    {v.salario && <span className="tabular">{v.salario}</span>}
                    {v.jaCandidatou && <span className="font-semibold text-reef">Você já se candidatou</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-abyss/70">
            {out.total > out.vagas.length ? `Mostrando ${out.vagas.length} de ${out.total}. ` : ""}
            <Link href={out.verTodas} onClick={onNavigate} className="font-semibold text-tide hover:underline">Abrir a busca de vagas</Link>
          </p>
        </div>
      );
    }
    case "tool-ver_vaga": {
      if (busy) return <Working>Lendo a vaga…</Working>;
      if (failed || part.state !== "output-available" || "erro" in part.output) return <Note>Não encontrei essa vaga.</Note>;
      const v = part.output;
      const c = "compatibilidade" in v ? v.compatibilidade : undefined;
      return (
        <Link href={v.link} onClick={onNavigate} className="block rounded-xl border border-mist bg-field/60 px-3 py-2.5 transition hover:border-tide/60">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block font-semibold leading-snug">{v.titulo}</span>
              <span className="block truncate text-xs text-abyss/70">{v.empresa} · {v.cidade} · {v.modalidade}</span>
            </span>
            {c && <Score value={c.nota} />}
          </span>
          {c && c.habilidadesQueFaltam.length > 0 && (
            <span className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-abyss/70">Faltam:</span>
              {c.habilidadesQueFaltam.map((s) => <span key={s} className="rounded-full border border-coral/40 bg-coral/10 px-2 py-0.5 text-coral">{s}</span>)}
            </span>
          )}
        </Link>
      );
    }
    case "tool-listar_empresas":
      return busy ? <Working>Procurando empresas…</Working> : failed ? <Note>Não consegui listar as empresas.</Note> : null;
    case "tool-meu_perfil":
      return busy ? <Working>Lendo seu perfil…</Working> : failed ? <Note>Não consegui ler seu perfil.</Note> : null;
    case "tool-minhas_candidaturas":
      return busy ? <Working>Conferindo suas candidaturas…</Working> : failed ? <Note>Não consegui ler suas candidaturas.</Note> : null;
    case "tool-meu_curriculo":
      return busy ? <Working>Lendo seu currículo…</Working> : failed ? <Note>Não consegui ler seu currículo.</Note> : null;
    case "tool-candidatos_da_vaga":
      return busy ? <Working>Comparando os candidatos…</Working> : failed ? <Note>Não consegui ler os candidatos.</Note> : null;
    case "tool-vagas_da_empresa":
      return busy ? <Working>Conferindo suas vagas…</Working> : failed ? <Note>Não consegui ler suas vagas.</Note> : null;
    default:
      return null;
  }
}

/* ---------- conversa ---------- */

export default function Conversation({ who, initial, onClose, titleId, mode = "carreira", jobId }: {
  who: Who; initial: AssistantUIMessage[]; onClose?: () => void; titleId: string; mode?: AssistantMode; jobId?: string;
}) {
  const owner = `${who.role}:${who.firstName ?? ""}`;
  const store = mode === "carreira" ? STORE : `${STORE}:${mode}`;
  const meta = mode === "carreira" ? null : MODES[mode];
  const transport = useMemo(() => new DefaultChatTransport<AssistantUIMessage>({ api: "/api/assistant", body: { mode, ...(jobId ? { jobId } : {}) } }), [mode, jobId]);
  const { messages, sendMessage, status, stop, error, setMessages, clearError, regenerate } = useChat<AssistantUIMessage>({
    messages: initial, transport, throttle: 40,
  });
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const failure = errorText(error);

  // guarda a conversa nesta aba quando uma resposta termina
  useEffect(() => {
    if (busy) return;
    try { sessionStorage.setItem(store, JSON.stringify({ owner, messages: messages.slice(-40) })); } catch { /* sem armazenamento: só nesta visita */ }
  }, [messages, busy, owner, store]);

  // acompanha o fim da conversa enquanto a resposta chega
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: busy ? "auto" : "smooth" });
  }, [messages, busy, failure]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // no celular a conversa cobre a tela: ao seguir um link, ela fecha para mostrar a página
  const onNavigate = useCallback(() => { if (onClose && window.matchMedia("(max-width: 639px)").matches) onClose(); }, [onClose]);

  function submit(value: string) {
    const q = value.trim();
    if (!q || busy || q.length > MAX_TEXT) return;
    if (error) clearError();
    sendMessage({ text: q });
    setText("");
  }

  function reset() {
    if (busy) stop();
    setMessages([]);
    clearError();
    try { sessionStorage.removeItem(store); } catch { /* nada a limpar */ }
    inputRef.current?.focus();
  }

  const last = messages.at(-1);
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "assistant" && last.parts.every((p) => p.type === "step-start"));

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-mist px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-onaccent" aria-hidden="true"
            style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accentb)))" }}><SonarIcon className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 id={titleId} className="truncate font-display text-base font-semibold leading-tight">{meta?.title ?? "Assistente Nautiwork"}</h2>
            <p className="truncate text-xs text-abyss/70">{meta ? meta.sub : who.role === "CANDIDATE" ? "Vagas, perfil e candidaturas" : who.role === "COMPANY" ? "Suas vagas e candidaturas" : "Vagas, empresas e dúvidas do site"}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 0 && (
            <button type="button" onClick={reset} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-abyss/80 hover:bg-foam hover:text-abyss" aria-label="Nova conversa" title="Nova conversa">
              <NewChat /><span className="hidden sm:inline">Nova conversa</span>
            </button>
          )}
          {onClose && <Link href="/assistente" onClick={onClose} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-abyss/80 hover:bg-foam hover:text-abyss" title="Currículo, entrevista e mais">Mais funções</Link>}
          {onClose && <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-abyss/80 hover:bg-foam hover:text-abyss" aria-label="Fechar assistente"><Close /></button>}
        </div>
      </header>

      <div ref={listRef} role="log" aria-live="polite" aria-busy={busy} aria-label="Conversa com o assistente"
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 text-[15px] leading-relaxed">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="font-display text-lg font-semibold">{who.firstName ? `Oi, ${who.firstName}.` : "Oi."} Em que posso ajudar?</p>
              <p className="text-sm text-abyss/75">
                {meta ? meta.intro : <>{who.role === "VISITOR" ? "Pergunte sobre vagas, empresas ou como o site funciona. Entrando na sua conta, eu também calculo a compatibilidade com cada vaga."
                  : who.role === "CANDIDATE" ? "Posso procurar vagas pela sua compatibilidade, explicar a nota e acompanhar suas candidaturas."
                  : who.role === "COMPANY" ? "Posso resumir suas vagas e candidaturas e ajudar a escrever o texto de uma vaga."
                  : "Posso consultar vagas e empresas públicas e explicar o funcionamento do site."}
                {" "}Eu só consulto: candidaturas e alterações você faz nas páginas do site.</>}
              </p>
            </div>
            <ul className="flex flex-col gap-2" aria-label="Sugestões de perguntas">
              {(meta?.suggestions ?? SUGGESTIONS[who.role]).map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => submit(s)}
                    className="w-full rounded-xl border border-mist bg-field/50 px-3 py-2 text-left text-sm transition hover:border-tide/60 hover:text-tide">{s}</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m) => m.role === "user" ? (
          <div key={m.id} className="flex justify-end">
            <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-tide/15 px-3.5 py-2 text-abyss">
              <span className="sr-only">Você: </span>{m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
            </p>
          </div>
        ) : (
          <div key={m.id} className="space-y-3">
            <span className="sr-only">Assistente:</span>
            {m.parts.map((p, i) => p.type === "text"
              ? (p.text.trim() ? <Markdown key={i} text={p.text} onNavigate={onNavigate} /> : null)
              : <ToolView key={i} part={p} onNavigate={onNavigate} />)}
          </div>
        ))}

        {waiting && <Working>Pensando…</Working>}

        {failure && (
          <div role="alert" className="rounded-xl border border-coral/40 bg-coral/10 px-3 py-2.5 text-sm">
            <p>{failure}</p>
            {last?.role === "user" && <button type="button" onClick={() => { clearError(); regenerate(); }} className="mt-1.5 font-semibold text-coral hover:underline">Tentar de novo</button>}
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(text); }} className="border-t border-mist px-3 pb-3 pt-2.5">
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-field px-3 py-2 focus-within:border-tide">
          <label htmlFor="nw-assistant-input" className="sr-only">Sua pergunta</label>
          <textarea id="nw-assistant-input" ref={inputRef} value={text} rows={1} maxLength={MAX_TEXT + 200}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(text); } }}
            placeholder={meta?.placeholder ?? (who.role === "COMPANY" ? "Pergunte sobre suas vagas…" : "Pergunte sobre vagas…")}
            className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-[15px] text-abyss outline-none [field-sizing:content] placeholder:text-abyss/60" />
          {busy ? (
            <button type="button" onClick={() => stop()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-mist text-abyss hover:border-coral hover:text-coral" aria-label="Parar resposta"><Stop /></button>
          ) : (
            <button type="submit" disabled={!text.trim() || text.length > MAX_TEXT} className="btn-primary h-9 w-9 shrink-0 rounded-full p-0 disabled:opacity-40" aria-label="Enviar pergunta"><Send /></button>
          )}
        </div>
        <p className="mt-1.5 flex justify-between gap-3 px-1 text-[11px] text-abyss/60">
          <span>Respostas geradas por IA podem ter erros. Confira na página da vaga. <Link href="/privacidade#assistente" onClick={onNavigate} className="underline hover:text-tide">Privacidade</Link></span>
          {text.length > MAX_TEXT - 150 && <span className={`tabular shrink-0 ${text.length > MAX_TEXT ? "font-semibold text-coral" : ""}`}>{text.length}/{MAX_TEXT}</span>}
        </p>
      </form>
    </>
  );
}

