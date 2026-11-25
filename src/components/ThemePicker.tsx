"use client";
import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_MODE, DEFAULT_PALETTE, PALETTES, PALETTE_IDS, THEME_STORAGE_KEY, backgroundOf, type ModeChoice, type PaletteId } from "@/lib/themes";

type Choice = { palette: PaletteId; mode: ModeChoice };
const media = () => window.matchMedia("(prefers-color-scheme: light)");
const resolved = (mode: ModeChoice): "dark" | "light" => (mode === "system" ? (media().matches ? "light" : "dark") : mode);

function read(): Choice {
  const r = document.documentElement.dataset;
  const palette = PALETTE_IDS.includes(r.palette as PaletteId) ? (r.palette as PaletteId) : DEFAULT_PALETTE;
  const mode = r.theme === "light" || r.theme === "system" || r.theme === "dark" ? (r.theme as ModeChoice) : DEFAULT_MODE;
  return { palette, mode };
}

/** Marca paleta e modo no <html>, guarda neste aparelho e ajusta a cor da barra do navegador. */
function apply(c: Choice) {
  const r = document.documentElement;
  const mode = resolved(c.mode);
  r.dataset.palette = c.palette;
  r.dataset.theme = c.mode;
  r.dataset.mode = mode;
  try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(c)); } catch { /* navegação privada: vale só nesta visita */ }
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
  meta.content = backgroundOf(c.palette, mode);
  window.dispatchEvent(new Event("nw-theme"));
}

function useTheme() {
  const [choice, setChoice] = useState<Choice | null>(null);
  useEffect(() => {
    const sync = () => setChoice(read());
    sync();
    // "Sistema": acompanha a troca de claro/escuro do aparelho sem recarregar
    const onSystem = () => { const c = read(); if (c.mode === "system") apply(c); };
    const q = media();
    q.addEventListener("change", onSystem);
    window.addEventListener("nw-theme", sync);
    return () => { q.removeEventListener("change", onSystem); window.removeEventListener("nw-theme", sync); };
  }, []);
  const update = (patch: Partial<Choice>) => { const next = { ...(choice ?? read()), ...patch }; apply(next); setChoice(next); };
  return { choice, update };
}

const modes: { id: ModeChoice; label: string; icon: string }[] = [
  { id: "dark", label: "Escuro", icon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" },
  { id: "light", label: "Claro", icon: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
  { id: "system", label: "Sistema", icon: "M4 5h16v11H4zM9 20h6M12 16v4" },
];

/** Conteúdo da escolha de aparência: usado no botão do topo e na janela de Configurações. */
export function AppearancePanel({ compact = false }: { compact?: boolean }) {
  const { choice, update } = useTheme();
  const modeLabel = useId();
  const paletteLabel = useId();
  if (!choice) return <div className="h-48" aria-hidden="true" />;
  const shown = resolved(choice.mode);
  return (
    <div className="space-y-5">
      <div>
        <p id={modeLabel} className="mb-2 text-sm font-medium text-abyss/90">Modo</p>
        <div role="radiogroup" aria-labelledby={modeLabel} className="grid grid-cols-3 gap-1 rounded-control border border-mist bg-fossa/60 p-1">
          {modes.map((m) => {
            const on = choice.mode === m.id;
            return (
              <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => update({ mode: m.id })}
                className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-[7px] text-sm font-semibold transition-colors ${on ? "bg-foam text-abyss shadow-[inset_0_0_0_1px_rgb(var(--c-tide)/0.45)]" : "text-abyss/70 hover:text-abyss"}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={m.icon} /></svg>
                {m.label}
              </button>
            );
          })}
        </div>
        {choice.mode === "system" && <p className="mt-1.5 text-xs text-abyss/60">Segue o aparelho. Agora: {shown === "dark" ? "escuro" : "claro"}.</p>}
      </div>
      <div>
        <p id={paletteLabel} className="mb-2 text-sm font-medium text-abyss/90">Paleta de cores</p>
        <div role="radiogroup" aria-labelledby={paletteLabel} className={`grid gap-1.5 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
          {PALETTE_IDS.map((id) => {
            const p = PALETTES[id];
            const t = p[shown];
            const on = choice.palette === id;
            return (
              <button key={id} type="button" role="radio" aria-checked={on} onClick={() => update({ palette: id })}
                className={`flex min-h-[48px] items-center gap-3 rounded-control border px-3 py-2 text-left transition-colors ${on ? "border-tide bg-foam" : "border-mist hover:border-tide/50 hover:bg-foam/60"}`}>
                {/* amostra: fundo, cartão, destaque e sucesso da paleta no modo atual */}
                <span aria-hidden="true" className="flex h-7 w-12 shrink-0 items-center gap-0.5 rounded-[6px] border p-1" style={{ background: t.fossa, borderColor: t.mist }}>
                  <span className="h-full flex-1 rounded-[3px]" style={{ background: t.casco }} />
                  <span className="h-full w-2 rounded-[3px]" style={{ background: t.tide }} />
                  <span className="h-full w-2 rounded-[3px]" style={{ background: t.reef }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{p.name}</span>
                  <span className="block text-xs text-abyss/60">{p.description}</span>
                </span>
                {on && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--c-tide))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-abyss/60">A escolha fica salva neste aparelho e vale para todas as páginas.</p>
    </div>
  );
}

/** Botão do topo: abre a escolha de aparência para qualquer pessoa, logada ou não. */
export function ThemeButton() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (!panel.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);
  return (
    <div className="relative">
      <button ref={btn} type="button" aria-expanded={open} aria-controls={id} aria-label="Aparência: tema e modo claro ou escuro"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-control text-abyss/80 transition-colors hover:bg-casco hover:text-abyss">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div ref={panel} id={id} role="dialog" aria-label="Aparência"
          className="fixed inset-x-3 top-[68px] z-40 rounded-panel border border-mist bg-casco p-4 shadow-[0_24px_60px_-12px_rgb(0_0_0/var(--shade-a))] motion-safe:animate-menu sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[340px]">
          <p className="mb-4 font-display text-base font-semibold">Aparência</p>
          <AppearancePanel compact />
        </div>
      )}
    </div>
  );
}
