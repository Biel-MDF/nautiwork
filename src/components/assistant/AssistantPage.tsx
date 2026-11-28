"use client";
// Página do assistente (também a aba "Assistente" do app): escolha do modo + conversa em tela cheia.
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ASSISTANT_MODES, modeAllowed, type AssistantMode } from "@/modules/assistant/modes";
import type { AssistantUIMessage } from "@/modules/assistant/agent";
import type { Who } from "./Conversation";

const Conversation = dynamic(() => import("./Conversation"), { ssr: false, loading: () => <p className="p-4 text-sm text-abyss/70">Abrindo…</p> });

const LABEL: Record<AssistantMode, [string, string]> = {
  carreira: ["Vagas e carreira", "Acha vagas que combinam e tira dúvidas"],
  curriculo: ["Revisar currículo", "Pontos fortes e o que melhorar"],
  entrevista: ["Simulado de entrevista", "5 perguntas com retorno"],
  empresa: ["Ajuda para empresas", "Anúncio da vaga e resumo de candidatos"],
};

export function AssistantPage() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const titleId = useId();
  const [who, setWho] = useState<Who | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [stored, setStored] = useState<((owner: string, mode: AssistantMode) => AssistantUIMessage[]) | null>(null);

  useEffect(() => {
    fetch("/api/assistant", { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : Promise.reject((await r.json().catch(() => null))?.error ?? "Não consegui abrir o assistente.")))
      .then(async (w: Who) => { const m = await import("./Conversation"); setStored(() => m.load); setWho(w); })
      .catch((e) => setFailed(typeof e === "string" ? e : "Não consegui abrir o assistente. Confira sua conexão."));
  }, []);

  if (failed) return <p className="card mt-5 text-sm">{failed} <Link href="/jobs" className="font-semibold text-tide hover:underline">Ver vagas</Link></p>;
  if (!who || !stored) return <div className="card mt-5 h-[60vh]" aria-busy="true"><p className="text-sm text-abyss/70">Abrindo o assistente…</p></div>;
  if (!who.available) return <p className="card mt-5 text-sm">O assistente não está disponível neste ambiente.</p>;

  const allowed = ASSISTANT_MODES.filter((m) => modeAllowed(m, who.role));
  const asked = params.get("modo") as AssistantMode | null;
  const mode: AssistantMode = asked && allowed.includes(asked) ? asked : "carreira";
  const jobId = mode === "entrevista" ? params.get("vaga") ?? undefined : undefined;
  const locked = asked && !allowed.includes(asked) ? asked : null;
  const pick = (m: AssistantMode) => router.replace(m === "carreira" ? path : `${path}?modo=${m}`, { scroll: false });

  return (
    <div className="mt-5 space-y-4">
      <div role="tablist" aria-label="O que você quer fazer" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {allowed.map((m) => (
          <button key={m} role="tab" type="button" aria-selected={m === mode} onClick={() => pick(m)}
            className={`shrink-0 rounded-panel border px-4 py-2.5 text-left transition ${m === mode ? "border-tide bg-tide/10" : "border-mist hover:border-tide/50"}`}>
            <span className="block text-sm font-semibold">{LABEL[m][0]}</span><span className="block text-xs text-abyss/65">{LABEL[m][1]}</span>
          </button>
        ))}
      </div>
      {locked && <p className="text-sm text-abyss/75">{locked === "empresa" ? "A ajuda para empresas aparece quando você entra com uma conta de empresa." : "Entre como candidato para usar este modo."} <Link href="/login?next=/assistente" className="font-semibold text-tide hover:underline">Entrar</Link></p>}
      <section aria-labelledby={titleId} className="flex h-[calc(100dvh-17rem)] min-h-[440px] flex-col overflow-hidden rounded-panel border border-mist bg-casco sm:h-[min(720px,calc(100dvh-16rem))]">
        <Conversation key={`${mode}:${jobId ?? ""}:${who.role}`} who={who} initial={stored(`${who.role}:${who.firstName ?? ""}`, mode)} titleId={titleId} mode={mode} jobId={jobId} />
      </section>
    </div>
  );
}
