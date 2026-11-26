"use client";
// Botão "Voltar" do topo. Volta para a página anterior dentro do site; se a pessoa chegou
// direto (link externo, página recarregada), vai para a página "pai" do endereço atual,
// por exemplo /jobs/123 → /jobs. Assim o botão nunca leva para fora do site nem fica parado.
import { usePathname, useRouter } from "next/navigation";
import { parentOf } from "@/lib/nav";
import { useEffect } from "react";

const KEY = "nw-nav";

function readStack(): string[] {
  try { const s = JSON.parse(sessionStorage.getItem(KEY) ?? "[]"); return Array.isArray(s) ? s : []; } catch { return []; }
}
function writeStack(s: string[]) { try { sessionStorage.setItem(KEY, JSON.stringify(s.slice(-30))); } catch { /* sem armazenamento */ } }

/** Registra a navegação dentro do site (fica no layout raiz). */
export function NavHistory() {
  const path = usePathname();
  useEffect(() => {
    // filtros e abas mudam só a busca; para "voltar" conta a página
    const here = path;
    const s = readStack();
    if (s.at(-1) === here) return;
    if (s.at(-2) === here) { s.pop(); writeStack(s); return; } // voltou (botão ou navegador)
    s.push(here);
    writeStack(s);
  }, [path]);
  return null;
}

/** Página "pai" de um endereço, para quando não há para onde voltar. */
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const path = usePathname();
  if (path === "/") return null;

  function back() {
    const s = readStack();
    if (s.length >= 2 && s.at(-1) === path) router.back();
    else router.push(parentOf(path));
  }

  return (
    <button type="button" onClick={back} aria-label="Voltar para a página anterior" title="Voltar"
      className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-mist/70 px-2.5 text-sm font-semibold text-abyss/85 transition-colors hover:border-tide/60 hover:text-abyss ${className}`}>
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      <span className="hidden pr-1 lg:inline">Voltar</span>
    </button>
  );
}
