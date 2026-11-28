"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { viewModeLabel, viewModes, type ViewMode } from "@/lib/view-mode";

/** Troca o modo e recarrega a página certa (navegação completa: todo o site se redesenha). */
export function useSwitchView() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function go(mode: ViewMode | "admin") {
    setBusy(mode); setError("");
    const r = await api<{ redirect: string }>("POST", "/api/admin/view", { mode });
    if (!r.ok) { setBusy(null); return setError(r.data.error ?? "Não foi possível trocar a visão."); }
    window.location.assign(r.data.redirect);
  }
  return { go, busy, error };
}

const eye = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>;

/** Barra fixa enquanto o admin vê o site como outra pessoa: deixa claro o modo e permite sair. */
export function ViewModeBar({ mode, as }: { mode: ViewMode; as: string | null }) {
  const { go, busy, error } = useSwitchView();
  return (
    <div role="region" aria-label="Modo de visualização" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-panel border border-[#FFCF70]/50 bg-[#1D1A0F]/95 p-3 text-sm shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur sm:inset-x-6 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5 text-[#FFE2A3]">
          <span className="mt-0.5 shrink-0">{eye}</span>
          <p>
            <span className="font-semibold">Vendo o site como {viewModeLabel[mode].toLowerCase()}</span>
            {as && <span className="text-[#FFE2A3]/75"> ({as})</span>}.{" "}
            <span className="text-[#FFE2A3]/75">{mode === "visitor" ? "Sem login: é o que qualquer pessoa vê." : `O que você fizer aqui fica salvo no seu perfil de ${mode === "candidate" ? "candidato" : "empresa"}.`}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
          <label className="sr-only" htmlFor="view-switch">Trocar visão</label>
          <select id="view-switch" value={mode} disabled={!!busy} onChange={(e) => go(e.target.value as ViewMode)}
            className="min-h-[40px] rounded-control border border-[#FFCF70]/40 bg-transparent px-3 text-[#FFE2A3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCF70]">
            {viewModes.map((m) => <option key={m} value={m} className="bg-fossa text-abyss">{viewModeLabel[m]}</option>)}
          </select>
          <button type="button" onClick={() => go("admin")} disabled={!!busy}
            className="min-h-[40px] rounded-control bg-[#FFCF70] px-4 font-semibold text-[#1D1A0F] hover:bg-[#FFE2A3] disabled:opacity-70">
            {busy === "admin" ? "Voltando..." : "Voltar ao modo admin"}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-coral">{error}</p>}
    </div>
  );
}

/** Botões para entrar numa visão (painel do admin e menu da conta). */
export function ViewAsButtons({ compact = false }: { compact?: boolean }) {
  const { go, busy, error } = useSwitchView();
  const hint: Record<ViewMode, string> = {
    visitor: "Página pública, sem login",
    candidate: "Painel, perfil e candidaturas de um candidato demo",
    company: "Painel, vagas e candidatos de uma empresa demo",
  };
  return (
    <div>
      <div className={compact ? "grid gap-1" : "grid gap-3 sm:grid-cols-3"}>
        {viewModes.map((m) => (
          <button key={m} type="button" onClick={() => go(m)} disabled={!!busy}
            className={compact ? "flex min-h-[44px] w-full items-center gap-3 rounded-control px-3 text-left text-sm hover:bg-foam disabled:opacity-60"
              : "card flex flex-col items-start gap-1 text-left transition-colors hover:border-tide/60 disabled:opacity-60"}>
            {compact ? <>{eye}<span>Ver como {viewModeLabel[m].toLowerCase()}</span></> : (
              <>
                <span className="flex items-center gap-2 font-semibold">{eye}{busy === m ? "Abrindo..." : `Ver como ${viewModeLabel[m].toLowerCase()}`}</span>
                <span className="text-sm text-abyss/65">{hint[m]}</span>
              </>
            )}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-coral">{error}</p>}
    </div>
  );
}

/** Itens do menu da conta do admin (role="menuitem" para a navegação por setas do menu). */
export function ViewAsMenuItems() {
  const { go, busy } = useSwitchView();
  return (
    <>
      {viewModes.map((m) => (
        <button key={m} role="menuitem" type="button" onClick={() => go(m)} disabled={!!busy}
          className="flex min-h-[40px] w-full items-center gap-3 rounded-control px-3 text-left text-sm text-abyss/90 hover:bg-foam focus:bg-foam focus:outline-none disabled:opacity-60">
          {eye}{busy === m ? "Abrindo..." : viewModeLabel[m]}
        </button>
      ))}
    </>
  );
}
