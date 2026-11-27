"use client";
// Quem está navegando, buscado em /api/me. Uma busca por carregamento de página, compartilhada
// entre o menu, o menu do celular e a barra do modo de visualização. A última resposta fica no
// sessionStorage, então trocar de página não pisca "Entrar" para quem já está logado.
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { MenuUser } from "@/components/AccountMenu";
import type { ViewMode } from "@/lib/view-mode";

export type Me = { user: MenuUser | null; unread?: number; mode: ViewMode | null; as: string | null };
const KEY = "nw-me";
let state: Me | undefined;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function read(): Me | undefined {
  if (state === undefined && typeof window !== "undefined") {
    try { const s = sessionStorage.getItem(KEY); if (s) state = JSON.parse(s); } catch { /* sem armazenamento */ }
  }
  return state;
}
function set(next: Me) {
  state = next;
  try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignora */ }
  listeners.forEach((l) => l());
}

/** Busca de novo (depois de entrar, sair, trocar foto ou nome). */
export function reloadMe() {
  inflight ??= fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: Me | null) => { if (d) set(d); })
    .catch(() => { /* rede fora: mantém o que tinha */ })
    .finally(() => { inflight = null; });
  return inflight;
}

if (typeof window !== "undefined") window.addEventListener("nw:me", () => void reloadMe());

/** undefined enquanto não se sabe; depois, o estado da sessão. */
export function useMe(): Me | undefined {
  const me = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => undefined);
  const path = usePathname();
  // confere a cada troca de página: entrar e sair sempre mudam de página
  useEffect(() => { void reloadMe(); }, [path]);
  return me;
}

/** Ao sair: some com a conta na hora, mesmo se a página não mudar. */
export function clearMe() { set({ user: null, mode: null, as: null }); }

/** Avisa o menu que os dados da conta mudaram. */
export const meChanged = () => window.dispatchEvent(new Event("nw:me"));
