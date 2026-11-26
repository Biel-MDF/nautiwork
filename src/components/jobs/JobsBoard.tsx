"use client";
// Lista de vagas com três formatos (lista e detalhes, grade, lista), escolhidos em
// "Interface" e guardados no navegador. No formato "lista e detalhes", em telas largas,
// clicar numa vaga abre o detalhe ao lado em vez de trocar de página.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { UI_OPTIONS, applyUi, readUi, type UiPrefs } from "@/lib/ui-prefs";

function splitActive() {
  const v = document.documentElement.dataset.uiJobs;
  return (!v || v === "split") && window.matchMedia("(min-width: 1024px)").matches;
}

export function JobsBoard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  function onClick(e: React.MouseEvent) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='/jobs/']");
    const card = a?.closest<HTMLElement>("[data-job]");
    if (!a || !card || !ref.current?.contains(card) || !splitActive()) return;
    if (a.getAttribute("href") !== `/jobs/${card.dataset.job}`) return; // só o título da vaga, não a empresa
    e.preventDefault();
    // marca na hora; o detalhe chega do servidor em seguida
    ref.current.querySelectorAll("[data-job]").forEach((el) => el.setAttribute("data-selected", String(el === card)));
    const next = new URLSearchParams(params.toString());
    next.set("vaga", card.dataset.job!);
    start(() => router.replace(`${path}?${next}`, { scroll: false }));
  }

  return (
    <div ref={ref} onClickCapture={onClick} data-pending={pending || undefined} className="jobs-board [&[data-pending]_.jobs-detail]:opacity-60">
      {children}
    </div>
  );
}

const VIEW_ICONS: Record<UiPrefs["jobs"], React.ReactNode> = {
  split: <><rect x="3.5" y="4.5" width="7" height="15" rx="1.5" /><rect x="13.5" y="4.5" width="7" height="15" rx="1.5" /></>,
  grid: <><rect x="3.5" y="4.5" width="7" height="6.5" rx="1.5" /><rect x="13.5" y="4.5" width="7" height="6.5" rx="1.5" /><rect x="3.5" y="13" width="7" height="6.5" rx="1.5" /><rect x="13.5" y="13" width="7" height="6.5" rx="1.5" /></>,
  list: <><path d="M4 6.5h16" /><path d="M4 12h16" /><path d="M4 17.5h16" /></>,
};

/** Troca o formato da lista de vagas (fica salvo para as próximas visitas). */
export function ViewSwitcher() {
  const [prefs, setPrefs] = useState<UiPrefs | null>(null);
  useEffect(() => {
    setPrefs(readUi());
    const on = (e: Event) => setPrefs((e as CustomEvent<UiPrefs>).detail);
    window.addEventListener("nw-ui", on);
    return () => window.removeEventListener("nw-ui", on);
  }, []);
  const current = prefs?.jobs ?? "split";
  const views = Object.entries(UI_OPTIONS.jobs.values) as [UiPrefs["jobs"], string][];
  return (
    <div role="radiogroup" aria-label="Formato da lista de vagas" className="hidden items-center gap-1 rounded-full border border-mist/70 bg-casco/40 p-1 md:flex">
      {views.map(([v, label]) => (
        <button key={v} type="button" role="radio" aria-checked={current === v} title={label} aria-label={label}
          onClick={() => applyUi({ ...(prefs ?? readUi()), jobs: v })}
          className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${current === v ? "bg-foam text-tide" : "text-abyss/70 hover:text-abyss"} ${v === "split" ? "max-lg:hidden" : ""}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">{VIEW_ICONS[v]}</svg>
          <span className="hidden xl:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** No celular, os filtros ficam recolhidos atrás de um botão; no computador, sempre à vista. */
export function FiltersToggle({ active, children }: { active: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="filtros"
        className="btn-ghost w-full justify-between md:hidden">
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          Filtros{active > 0 && <span className="tabular rounded-full bg-tide/15 px-2 py-0.5 text-xs text-tide">{active} ativos</span>}
        </span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div id="filtros" className={`${open ? "mt-3 block" : "hidden"} md:block`}>{children}</div>
    </div>
  );
}
