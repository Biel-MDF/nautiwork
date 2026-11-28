"use client";
// App instalável: registra o service worker e oferece "Instalar app".
// Android/Chrome/Edge: usa o pedido nativo do navegador. iPhone/iPad (Safari): explica o caminho,
// porque o Safari não tem pedido automático.
import { useEffect, useState, useSyncExternalStore } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let deferred: InstallEvent | null = null;
const subs = new Set<() => void>();
const ping = () => subs.forEach((f) => f());

/** Liga o service worker (só em produção) e guarda o pedido de instalação para o botão. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* sem service worker o site funciona igual */ });
    }
    const onPrompt = (e: Event) => { e.preventDefault(); deferred = e as InstallEvent; ping(); };
    const onInstalled = () => { deferred = null; ping(); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  return null;
}

type Env = "installed" | "prompt" | "ios" | "other";
function env(): Env {
  if (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone) return "installed";
  if (deferred) return "prompt";
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "other";
}

export function useInstall() {
  const state = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, env, () => "other" as Env);
  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null; ping();
    return outcome === "accepted";
  };
  return { state, install };
}

/** Botão + instruções. variant "full" mostra os passos de cada sistema. */
export function InstallApp({ variant = "button" }: { variant?: "button" | "full" }) {
  const { state, install } = useInstall();
  const [help, setHelp] = useState(false);
  if (state === "installed") return variant === "full" ? <p className="card text-sm">O Nautiwork já está instalado neste aparelho. Abra pelo ícone na tela inicial.</p> : null;
  const steps = state === "ios"
    ? ["Toque no botão Compartilhar do Safari (o quadrado com a seta para cima).", "Escolha \"Adicionar à Tela de Início\".", "Toque em Adicionar. O ícone do Nautiwork aparece na tela."]
    : ["Abra o menu do navegador (os três pontos).", "Escolha \"Instalar app\" ou \"Adicionar à tela inicial\".", "Confirme. O ícone do Nautiwork aparece na tela."];
  return (
    <div className={variant === "full" ? "space-y-4" : ""}>
      <button type="button" className={variant === "full" ? "btn-primary" : "btn-ghost"}
        onClick={async () => { if (state === "prompt") await install(); else setHelp((h) => !h); }}
        aria-expanded={state === "prompt" ? undefined : help || variant === "full"}>
        Instalar o app
      </button>
      {(help || (variant === "full" && state !== "prompt")) && (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-abyss/85">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
      )}
    </div>
  );
}
