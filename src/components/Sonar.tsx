"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { contractLabel, salaryRange, seniorityLabel, workModeLabel } from "@/lib/labels";
import { CompanyMark } from "./CompanyMark";
import { CompanyName } from "./CompanyName";

export type SonarJob = {
  id: string; title: string; area: string; location: string;
  workMode: keyof typeof workModeLabel; contractType: keyof typeof contractLabel; seniority: keyof typeof seniorityLabel;
  salaryMin: number | null; salaryMax: number | null;
};
export type SonarCompany = {
  id: string; userId: string; name: string; industry: string | null; location: string | null; description: string | null;
  imageVersion: number | null; jobs: SonarJob[];
};

const SWEEP_S = 6; // uma volta do feixe; cada empresa "acende" quando ele passa por ela
const plain = (n: string) => n.replace(/\[[^\]]*\]\s*/g, "");

/** Conta quantas vagas há de cada tipo e devolve na ordem do rótulo, só os que existem. */
function tally<K extends string>(jobs: SonarJob[], key: (j: SonarJob) => K, labels: Record<K, string>) {
  const n = new Map<K, number>();
  for (const j of jobs) n.set(key(j), (n.get(key(j)) ?? 0) + 1);
  return (Object.keys(labels) as K[]).filter((k) => n.has(k)).map((k) => ({ label: labels[k], count: n.get(k)! }));
}

/**
 * Radar da página inicial: cada contato é uma empresa contratando.
 * Distância do centro = ordem da vaga mais recente (mais perto, publicou há menos tempo);
 * tamanho = quantidade de vagas abertas. Tocar numa empresa abre o painel com as vagas dela.
 */
export function Sonar({ companies }: { companies: SonarCompany[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = companies.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedId(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const n = companies.length;
  const points = companies.map((c, i) => {
    const angle = (i * 137.508 + 24) % 360; // ângulo áureo: espalha sem amontoar
    const radius = n === 1 ? 26 : 15 + (i / (n - 1)) * 25; // % do raio útil, em ordem de recência
    const rad = ((angle - 90) * Math.PI) / 180;
    const size = 30 + Math.min(c.jobs.length, 5) * 3; // 33 a 45 px
    return { c, angle, size, x: Math.round((50 + radius * Math.cos(rad)) * 100) / 100, y: Math.round((50 + radius * Math.sin(rad)) * 100) / 100 };
  });

  return (
    <figure className="mx-auto w-full max-w-[460px]">
      <div className="relative aspect-square">
        {/* mostrador: anéis de distância, rumos e marcas de grau */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <radialGradient id="sonar-floor" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(var(--c-foam))" stopOpacity=".9" />
              <stop offset="100%" stopColor="rgb(var(--c-fossa))" stopOpacity="1" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="196" fill="url(#sonar-floor)" stroke="rgb(var(--c-mist))" strokeWidth="1.5" />
          {[49, 98, 147].map((r) => <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="rgb(var(--c-tide))" strokeOpacity=".16" />)}
          <path d="M200 8v384M8 200h384" stroke="rgb(var(--c-tide))" strokeOpacity=".12" />
          {Array.from({ length: 72 }).map((_, i) => {
            const long = i % 9 === 0;
            const a = (i * 5 * Math.PI) / 180;
            const r1 = long ? 182 : 188;
            // arredondado: servidor e navegador calculam seno e cosseno com diferenças na última casa
            const q = (v: number) => Math.round(v * 100) / 100;
            return <line key={i} x1={q(200 + r1 * Math.sin(a))} y1={q(200 - r1 * Math.cos(a))} x2={q(200 + 194 * Math.sin(a))} y2={q(200 - 194 * Math.cos(a))}
              stroke="rgb(var(--c-tide))" strokeOpacity={long ? 0.5 : 0.2} strokeWidth={long ? 1.5 : 1} />;
          })}
          <circle cx="200" cy="200" r="4" fill="rgb(var(--c-tide))" />
        </svg>

        {/* feixe: gira sem parar */}
        <div className="pointer-events-none absolute inset-[2%] rounded-full motion-safe:animate-sweep-loop"
          style={{ background: "conic-gradient(from 0deg, transparent 0deg, transparent 290deg, rgb(var(--c-tide) / 0.05) 315deg, rgb(var(--c-tide) / 0.32) 359deg, rgb(var(--c-deep) / 0.85) 360deg)" }}
          aria-hidden="true" />

        {/* contatos: cada um é uma empresa com vagas abertas */}
        <ul aria-label="Empresas contratando">
          {points.map(({ c, angle, size, x, y }) => {
            const on = c.id === selectedId;
            const count = c.jobs.length;
            return (
              <li key={c.id} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
                <button type="button" onClick={() => setSelectedId(on ? null : c.id)}
                  aria-expanded={on} aria-controls={panelId}
                  aria-label={`${plain(c.name)}, ${count} ${count === 1 ? "vaga aberta" : "vagas abertas"}`}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 focus-visible:outline-offset-0">
                  <span className={`relative block rounded-[30%] ring-2 transition-transform duration-200 group-hover:scale-110 ${on ? "scale-110 ring-tide" : "ring-reef/70"} motion-safe:animate-echo`}
                    style={{ width: size, height: size, animationDelay: `${((angle / 360) * SWEEP_S).toFixed(2)}s` }}>
                    <CompanyMark userId={c.userId} name={c.name} imageVersion={c.imageVersion} size={size} />
                    <span className="tabular absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-fossa bg-reef px-1 text-[11px] font-bold leading-none text-fossa">
                      {count}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div id={panelId} ref={panelRef} aria-live="polite" className="mt-5">
        {selected ? <CompanyPanel company={selected} onClose={() => setSelectedId(null)} /> : (
          <figcaption className="text-center text-sm leading-relaxed text-abyss/70">
            {companies.length > 0 ? "Toque numa empresa no radar para ver as vagas dela. Mais perto do centro, vaga mais recente." : "Nenhuma empresa contratando agora."}
          </figcaption>
        )}
      </div>
    </figure>
  );
}

function CompanyPanel({ company: c, onClose }: { company: SonarCompany; onClose: () => void }) {
  const contracts = tally(c.jobs, (j) => j.contractType, contractLabel);
  const modes = tally(c.jobs, (j) => j.workMode, workModeLabel);
  const levels = tally(c.jobs, (j) => j.seniority, seniorityLabel);
  const count = c.jobs.length;
  return (
    <section aria-label={`Vagas de ${plain(c.name)}`} className="card motion-safe:animate-menu p-0 text-left">
      <header className="flex items-start gap-3 border-b border-mist p-4">
        <CompanyMark userId={c.userId} name={c.name} imageVersion={c.imageVersion} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight"><CompanyName name={c.name} /></h3>
          <p className="mt-0.5 text-sm text-abyss/65">{[c.industry, c.location].filter(Boolean).join(", ")}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar painel da empresa"
          className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-abyss/70 hover:bg-foam hover:text-abyss">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </header>

      <div className="space-y-4 p-4">
        <p className="flex items-baseline gap-2">
          <span className="tabular font-display text-3xl font-semibold text-reef">{count}</span>
          <span className="text-sm text-abyss/75">{count === 1 ? "vaga aberta" : "vagas abertas"}</span>
        </p>

        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2 text-sm">
          {([["Contrato", contracts], ["Modalidade", modes], ["Nível", levels]] as const).map(([label, items]) => (
            <div key={label} className="contents">
              <dt className="text-abyss/60">{label}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {items.map((t) => <span key={t.label} className="chip">{t.label}{t.count > 1 && <span className="tabular ml-1 text-abyss/60">{t.count}</span>}</span>)}
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="text-sm font-medium text-abyss/80">Vagas</p>
          <ul className="mt-2 max-h-[264px] divide-y divide-mist/70 overflow-y-auto rounded-control border border-mist/70">
            {c.jobs.map((j) => {
              const pay = salaryRange(j.salaryMin, j.salaryMax);
              return (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="block px-3 py-2.5 hover:bg-foam/60">
                    <span className="block font-medium text-abyss">{j.title}</span>
                    <span className="mt-0.5 block text-xs text-abyss/65">
                      {seniorityLabel[j.seniority]}, {contractLabel[j.contractType]}, {workModeLabel[j.workMode]} em {j.location}
                    </span>
                    {pay && <span className="tabular mt-0.5 block text-xs text-reef/90">{pay}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {c.description && <p className="text-sm leading-relaxed text-abyss/70">{c.description}</p>}
        <Link href={`/companies/${c.id}`} className="btn-ghost w-full">Ver página da empresa</Link>
      </div>
    </section>
  );
}
