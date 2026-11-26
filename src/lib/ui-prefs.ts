// Preferências de interface: largura do conteúdo, densidade e como a lista de vagas aparece.
// Ficam no navegador (localStorage) e viram atributos no <html> antes da primeira pintura,
// então a página já nasce no formato escolhido, sem pular. O CSS em globals.css faz o resto.

export const UI_STORAGE_KEY = "nw-ui";

export const UI_OPTIONS = {
  width: { label: "Largura do conteúdo", values: { normal: "Padrão", wide: "Ampla" }, default: "normal" },
  density: { label: "Espaçamento", values: { comfortable: "Confortável", compact: "Compacto" }, default: "comfortable" },
  jobs: { label: "Lista de vagas", values: { split: "Lista e detalhes", grid: "Grade", list: "Lista" }, default: "split" },
} as const;

export type UiKey = keyof typeof UI_OPTIONS;
export type UiPrefs = { [K in UiKey]: keyof (typeof UI_OPTIONS)[K]["values"] };

export const UI_DEFAULTS = Object.fromEntries(Object.entries(UI_OPTIONS).map(([k, v]) => [k, v.default])) as UiPrefs;

export function sanitizeUi(raw: unknown): UiPrefs {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = { ...UI_DEFAULTS } as Record<string, string>;
  for (const k of Object.keys(UI_OPTIONS) as UiKey[]) {
    const v = o[k];
    if (typeof v === "string" && v in UI_OPTIONS[k].values) out[k] = v;
  }
  return out as UiPrefs;
}

/** Script inline do <head>: aplica as preferências salvas antes de desenhar a página. */
export function uiBootScript(): string {
  const allowed = Object.fromEntries(Object.entries(UI_OPTIONS).map(([k, v]) => [k, Object.keys(v.values)]));
  return `(function(){try{var s=JSON.parse(localStorage.getItem("${UI_STORAGE_KEY}")||"{}");var A=${JSON.stringify(allowed)};var d=${JSON.stringify(UI_DEFAULTS)};var r=document.documentElement;Object.keys(A).forEach(function(k){r.dataset["ui"+k[0].toUpperCase()+k.slice(1)]=A[k].indexOf(s[k])>=0?s[k]:d[k]})}catch(e){}})();`;
}

/** Lê, aplica e salva (lado do navegador). */
export function readUi(): UiPrefs {
  try { return sanitizeUi(JSON.parse(localStorage.getItem(UI_STORAGE_KEY) ?? "{}")); } catch { return { ...UI_DEFAULTS }; }
}

export function applyUi(prefs: UiPrefs) {
  const r = document.documentElement;
  r.dataset.uiWidth = prefs.width;
  r.dataset.uiDensity = prefs.density;
  r.dataset.uiJobs = prefs.jobs;
  try { localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(prefs)); } catch { /* sem armazenamento: vale só nesta visita */ }
  window.dispatchEvent(new CustomEvent("nw-ui", { detail: prefs }));
}
