"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  CUSTOM_GROUPS, CUSTOM_GROUP_IDS, DEFAULT_CUSTOM, DEFAULT_MODE, DEFAULT_PALETTE, PALETTES, PALETTE_IDS, THEME_STORAGE_KEY,
  backgroundOf, customCss, customTokens, sanitizeCustom,
  type CustomGroup, type CustomTheme, type Mode, type ModeChoice, type PaletteId, type ThemeChoice, type Tokens,
} from "@/lib/themes";

/* ---------- estado do tema neste aparelho ---------- */

const media = () => window.matchMedia("(prefers-color-scheme: light)");
const resolved = (mode: ModeChoice): Mode => (mode === "system" ? (media().matches ? "light" : "dark") : mode);

function stored(): Partial<ThemeChoice> {
  try { return JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? "{}") ?? {}; } catch { return {}; }
}

function read(): ThemeChoice {
  const d = document.documentElement.dataset;
  const palette = d.palette === "custom" ? "custom" : PALETTE_IDS.includes(d.palette as PaletteId) ? (d.palette as PaletteId) : DEFAULT_PALETTE;
  const mode = d.theme === "light" || d.theme === "system" || d.theme === "dark" ? (d.theme as ModeChoice) : DEFAULT_MODE;
  // o tema personalizado fica guardado mesmo quando a pessoa volta para uma paleta pronta
  return { palette, mode, custom: sanitizeCustom(stored().custom) };
}

/** Marca paleta e modo no <html>, monta o CSS do tema personalizado, guarda e ajusta a barra do navegador. */
function apply(c: ThemeChoice) {
  const r = document.documentElement;
  const mode = resolved(c.mode);
  const custom = sanitizeCustom(c.custom);
  if (c.palette === "custom") {
    let st = document.getElementById("nw-custom") as HTMLStyleElement | null;
    if (!st) { st = document.createElement("style"); st.id = "nw-custom"; document.head.appendChild(st); }
    st.textContent = customCss(custom);
  }
  r.dataset.palette = c.palette;
  r.dataset.theme = c.mode;
  r.dataset.mode = mode;
  try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ palette: c.palette, mode: c.mode, custom })); } catch { /* navegação privada: vale só nesta visita */ }
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
  meta.content = backgroundOf({ ...c, custom }, mode);
  window.dispatchEvent(new Event("nw-theme"));
}

function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice | null>(null);
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
  const update = (patch: Partial<ThemeChoice>) => apply({ ...(choice ?? read()), ...patch });
  return { choice, update };
}

/* ---------- peças visuais ---------- */

const modes: { id: ModeChoice; label: string; icon: string }[] = [
  { id: "dark", label: "Escuro", icon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" },
  { id: "light", label: "Claro", icon: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
  { id: "system", label: "Sistema", icon: "M4 5h16v11H4zM9 20h6M12 16v4" },
];

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--c-tide))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
);

/** Amostra de uma paleta: fundo com brilho, cartão, botão em degradê e sucesso. */
function Swatch({ t }: { t: Tokens }) {
  return (
    <span aria-hidden="true" className="flex h-8 w-14 shrink-0 items-center gap-0.5 overflow-hidden rounded-[7px] border p-1" style={{ background: `linear-gradient(135deg, ${t.fossa} 55%, ${t.accent2}66)`, borderColor: t.mist }}>
      <span className="h-full flex-1 rounded-[3px]" style={{ background: t.casco }} />
      <span className="h-full w-2.5 rounded-[3px]" style={{ background: `linear-gradient(180deg, ${t.accent}, ${t.accentb})` }} />
      <span className="h-full w-2 rounded-[3px]" style={{ background: t.reef }} />
    </span>
  );
}

function ModePicker({ choice, update }: { choice: ThemeChoice; update: (p: Partial<ThemeChoice>) => void }) {
  const label = useId();
  return (
    <div>
      <p id={label} className="mb-2 text-sm font-medium text-abyss/90">Modo</p>
      <div role="radiogroup" aria-labelledby={label} className="grid grid-cols-3 gap-1 rounded-control border border-mist bg-fossa/60 p-1">
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
      {choice.mode === "system" && <p className="mt-1.5 text-xs text-abyss/60">Segue o aparelho. Agora: {resolved("system") === "dark" ? "escuro" : "claro"}.</p>}
    </div>
  );
}

/* ---------- escolha rápida: modo + paletas prontas ---------- */

/** Usado no botão do topo, em Configurações e na página Aparência. */
export function AppearancePanel({ compact = false, editorLink = true, onNavigate }: { compact?: boolean; editorLink?: boolean; onNavigate?: () => void }) {
  const { choice, update } = useTheme();
  const label = useId();
  if (!choice) return <div className="h-64" aria-hidden="true" />;
  const shown = resolved(choice.mode);
  const custom = sanitizeCustom(choice.custom);
  const option = (on: boolean) => `flex min-h-[52px] w-full items-center gap-3 rounded-control border px-3 py-2 text-left transition-colors ${on ? "border-tide bg-foam" : "border-mist hover:border-tide/50 hover:bg-foam/60"}`;
  return (
    <div className="space-y-5">
      <ModePicker choice={choice} update={update} />
      <div>
        <p id={label} className="mb-2 text-sm font-medium text-abyss/90">Paleta de cores</p>
        <div role="radiogroup" aria-labelledby={label} className={`grid gap-1.5 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
          {PALETTE_IDS.map((id) => {
            const p = PALETTES[id];
            const on = choice.palette === id;
            return (
              <button key={id} type="button" role="radio" aria-checked={on} onClick={() => update({ palette: id })} className={option(on)}>
                <Swatch t={p[shown]} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{p.name}</span><span className="block text-xs text-abyss/60">{p.description}</span></span>
                {on && <Check />}
              </button>
            );
          })}
          <button type="button" role="radio" aria-checked={choice.palette === "custom"} onClick={() => update({ palette: "custom" })} className={option(choice.palette === "custom")}>
            <Swatch t={customTokens(custom, shown)} />
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Meu tema</span><span className="block text-xs text-abyss/60">Montado por você com as cores do site</span></span>
            {choice.palette === "custom" && <Check />}
          </button>
        </div>
      </div>
      {editorLink && <Link href="/aparencia#meu-tema" onClick={onNavigate} className="btn-ghost w-full">Criar ou editar meu tema</Link>}
      <p className="text-xs text-abyss/60">A escolha fica salva neste aparelho e vale para todas as páginas.</p>
    </div>
  );
}

/* ---------- editor: tabela para montar o próprio tema ---------- */

/** Cor que representa cada grupo numa célula da tabela. */
function cellStyle(group: CustomGroup, t: Tokens): React.CSSProperties {
  switch (group) {
    case "fundo": return { background: `linear-gradient(135deg, ${t.fossa} 50%, ${t.casco} 50%)`, borderColor: t.mist };
    case "destaque": return { background: `linear-gradient(135deg, ${t.accent}, ${t.accentb})`, borderColor: t.accent };
    case "brilho": return { background: `radial-gradient(circle at 30% 30%, ${t.accent2}, ${t.accent2}99)`, borderColor: t.accent2 };
    case "sucesso": return { background: t.reef, borderColor: t.reef };
  }
}

export function ThemeEditor() {
  const { choice, update } = useTheme();
  if (!choice) return <div className="h-96" aria-hidden="true" />;
  const shown = resolved(choice.mode);
  const custom = sanitizeCustom(choice.custom);
  const t = customTokens(custom, shown);
  const set = (patch: Partial<CustomTheme>) => update({ palette: "custom", custom: { ...custom, ...patch } });
  const active = choice.palette === "custom";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card overflow-hidden p-0">
        {/* celular: uma linha por parte do site, com as sete cores lado a lado */}
        <div className="divide-y divide-mist/60 sm:hidden">
          {CUSTOM_GROUP_IDS.map((g) => (
            <div key={g} role="group" aria-label={CUSTOM_GROUPS[g].label} className="px-4 py-3">
              <p className="font-semibold">{CUSTOM_GROUPS[g].label} <span className="text-xs font-normal text-abyss/60">· {PALETTES[custom[g]].name}</span></p>
              <p className="text-xs text-abyss/60">{CUSTOM_GROUPS[g].hint}</p>
              <div className="mt-2.5 grid grid-cols-7 gap-1.5">
                {PALETTE_IDS.map((id) => {
                  const on = custom[g] === id;
                  return (
                    <button key={id} type="button" aria-pressed={on} aria-label={`${CUSTOM_GROUPS[g].label}: ${PALETTES[id].name}`} onClick={() => set({ [g]: id })}
                      className={`aspect-square w-full rounded-full border-2 ${on ? "ring-2 ring-tide ring-offset-2 ring-offset-casco" : ""}`}
                      style={cellStyle(g, PALETTES[id][shown])} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <caption className="sr-only">Para cada parte do site, escolha de qual paleta vem a cor</caption>
          <thead>
            <tr className="border-b border-mist">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Parte do site</th>
              {PALETTE_IDS.map((id) => <th key={id} scope="col" className="px-1 py-3 text-center text-xs font-medium text-abyss/70">{PALETTES[id].name}</th>)}
            </tr>
          </thead>
          <tbody>
            {CUSTOM_GROUP_IDS.map((g) => (
              <tr key={g} className="border-b border-mist/60 last:border-0">
                <th scope="row" className="px-4 py-3 text-left align-middle font-normal">
                  <span className="block font-semibold">{CUSTOM_GROUPS[g].label}</span>
                  <span className="block text-xs text-abyss/60">{CUSTOM_GROUPS[g].hint}</span>
                </th>
                {PALETTE_IDS.map((id) => {
                  const on = custom[g] === id;
                  return (
                    <td key={id} className="px-1 py-3 text-center">
                      <button type="button" aria-pressed={on} aria-label={`${CUSTOM_GROUPS[g].label}: ${PALETTES[id].name}`} onClick={() => set({ [g]: id })}
                        className={`mx-auto block h-10 w-10 rounded-full border-2 transition-transform hover:scale-105 ${on ? "ring-2 ring-tide ring-offset-2 ring-offset-casco" : ""}`}
                        style={cellStyle(g, PALETTES[id][shown])} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-mist px-4 py-3">
          <span className="mr-1 text-xs text-abyss/60">Começar a partir de:</span>
          {PALETTE_IDS.map((id) => (
            <button key={id} type="button" className="chip min-h-[32px] hover:border-tide/60" onClick={() => set({ fundo: id, destaque: id, brilho: id, sucesso: id })}>{PALETTES[id].name}</button>
          ))}
          <button type="button" className="chip min-h-[32px] hover:border-tide/60" onClick={() => set(DEFAULT_CUSTOM)}>Sugestão inicial</button>
        </div>
      </div>

      {/* prévia com as cores escolhidas, no modo atual, mesmo antes de ativar o tema */}
      <div className="space-y-3">
        <div className="overflow-hidden rounded-panel border p-4" style={{ background: `radial-gradient(120% 80% at 100% 0%, ${t.accent}40, transparent 60%), radial-gradient(90% 70% at 0% 100%, ${t.accent2}38, transparent 60%), ${t.fossa}`, borderColor: t.mist, color: t.abyss }}>
          <p className="text-xs font-medium" style={{ color: t.tide }}>Prévia do seu tema</p>
          <div className="mt-3 rounded-panel border p-4" style={{ background: t.casco, borderColor: t.mist }}>
            <p className="font-display text-base font-semibold">Desenvolvedor(a) Front-end</p>
            <p className="mt-0.5 text-xs" style={{ opacity: 0.7 }}>Recife, Híbrido, CLT</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ border: `1px solid ${t.reef}`, color: t.reef }}>85% compatível</span>
              <span className="rounded-[6px] border px-2 py-0.5 text-xs" style={{ background: t.foam, borderColor: t.mist }}>React</span>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex min-h-[36px] items-center rounded-control px-3 text-xs font-semibold" style={{ background: `linear-gradient(120deg, ${t.accent}, ${t.accentb})`, color: t.onaccent }}>Candidatar-se</span>
              <span className="inline-flex min-h-[36px] items-center px-1 text-xs font-semibold underline underline-offset-2" style={{ color: t.tide }}>Ver empresa</span>
            </div>
          </div>
        </div>
        {active
          ? <p className="text-sm font-medium text-reef">Seu tema está ativo. As mudanças aparecem no site na hora.</p>
          : <button type="button" className="btn-primary w-full" onClick={() => update({ palette: "custom" })}>Usar meu tema</button>}
        <p className="text-xs leading-relaxed text-abyss/60">Todas as combinações da tabela passam no teste de contraste de leitura, no modo claro e no escuro. Troque o modo para ver as duas versões.</p>
      </div>
    </div>
  );
}

/* ---------- botão do topo ---------- */

/** Abre a escolha de aparência para qualquer pessoa, logada ou não. */
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
          className="fixed inset-x-3 top-[68px] z-40 max-h-[calc(100vh-84px)] overflow-y-auto rounded-panel border border-mist bg-casco p-4 shadow-[0_24px_60px_-12px_rgb(0_0_0/var(--shade-a))] motion-safe:animate-menu sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[360px]">
          <p className="mb-4 font-display text-base font-semibold">Aparência</p>
          <AppearancePanel compact onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
