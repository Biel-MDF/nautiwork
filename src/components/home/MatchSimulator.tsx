"use client";
// "Sua análise": compara o perfil digitado (ou o do candidato logado) com as vagas abertas.
// A análise roda no servidor (/api/match) sobre todas as vagas abertas e não grava nada;
// o formulário fica guardado só nesta aba para não se perder ao recarregar.
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type Area = { id: string; name: string; score: number; matchedSkills: string[]; jobsInArea: number; bestJobScore: number | null; reason: string; demand: string; nextSkills: string[] };
type Job = { id: string; title: string; company: string; demo: boolean; area: string; location: string; workMode: string; contract: string; salary: string | null; score: number; missing: string[] };
type Result = { analyzed: number; areas: Area[]; jobs: Job[]; skillsToLearn: { name: string; jobs: number }[] };
export type MatchForm = { skills: string[]; interestArea: string; workMode: string; location: string; yearsExperience: number };

const EMPTY: MatchForm = { skills: [], interestArea: "", workMode: "", location: "", yearsExperience: 0 };
const STORE = "nw-match:v1";

function Pct({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
  const tone = value >= 60 ? "border-reef/50 bg-reef/10 text-reef" : value >= 30 ? "border-tide/50 bg-tide/10 text-deep" : "border-mist bg-foam text-abyss/75";
  return <span className={`tabular inline-flex shrink-0 items-center justify-center rounded-full border font-display font-semibold ${tone} ${size === "lg" ? "h-14 w-14 text-base" : "h-10 w-10 text-xs"}`}
    aria-label={`${value}% de compatibilidade`}>{value}%</span>;
}

export function AnalysisPanel({ skillOptions, areaOptions, cityOptions, prefill }: {
  skillOptions: string[]; areaOptions: string[]; cityOptions: string[]; prefill?: MatchForm | null;
}) {
  const [form, setForm] = useState<MatchForm>(EMPTY);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(STORE) ?? "null");
      if (s?.form) { setForm({ ...EMPTY, ...s.form }); if (s.result) setResult(s.result); return; }
    } catch { /* sem armazenamento */ }
    // candidato logado: a análise já abre feita com o perfil dele
    if (prefill && (prefill.skills.length || prefill.interestArea)) { setForm(prefill); void run(prefill, false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify({ form, result })); } catch { /* sem armazenamento */ }
  }, [form, result]);

  const set = <K extends keyof MatchForm>(k: K, v: MatchForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  function addSkill(raw: string) {
    const parts = raw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setForm((f) => {
      const have = new Set(f.skills.map((s) => s.toLowerCase()));
      return { ...f, skills: [...f.skills, ...parts.filter((p) => p.length <= 40 && !have.has(p.toLowerCase()))].slice(0, 30) };
    });
    setDraft("");
  }

  async function analyze(e?: React.FormEvent) {
    e?.preventDefault();
    const skills = draft.trim() ? [...form.skills, ...draft.split(",").map((s) => s.trim()).filter(Boolean)] : form.skills;
    if (draft.trim()) addSkill(draft);
    if (!skills.length && !form.interestArea) { setError("Adicione pelo menos uma habilidade ou escolha uma área."); return; }
    await run({ ...form, skills }, true);
  }

  async function run(data: MatchForm, scroll: boolean) {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Não foi possível analisar agora.");
      setResult(body);
      if (scroll) requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível analisar agora.");
    } finally { setBusy(false); }
  }

  const top = result?.areas[0];

  return (
    <div className="min-w-0">
      <div className="space-y-4">
        <form onSubmit={analyze} className="card space-y-4">
          <div>
            <p className="font-semibold">{prefill ? "Sua análise, com os dados do seu perfil" : "Monte um perfil rápido"}</p>
            <p className="mt-1 text-sm text-abyss/70">Comparamos com todas as vagas abertas agora e com o que o mercado pede em 20 áreas. Nada do que você digitar é salvo.</p>
          </div>
          <div>
            <label className="label" htmlFor={`${id}-skill`}>Suas habilidades</label>
            {form.skills.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Habilidades adicionadas">
                {form.skills.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => set("skills", form.skills.filter((x) => x !== s))}
                      className="chip inline-flex items-center gap-1 py-1 text-sm hover:border-coral/50 hover:text-coral" aria-label={`Remover ${s}`}>
                      {s}<span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input id={`${id}-skill`} value={draft} list={`${id}-skills`} onChange={(e) => setDraft(e.target.value)} autoComplete="off"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(draft); } }}
                placeholder={form.skills.length ? "Mais uma (Enter para adicionar)" : "Ex.: Excel, Comunicação, Python"} className="input flex-1" />
              <button type="button" onClick={() => addSkill(draft)} className="btn-ghost shrink-0 px-4" disabled={!draft.trim()}>Adicionar</button>
            </div>
            <datalist id={`${id}-skills`}>{skillOptions.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={`${id}-area`}>Área de interesse</label>
              <select id={`${id}-area`} value={form.interestArea} onChange={(e) => set("interestArea", e.target.value)} className="input">
                <option value="">Ainda não sei</option>
                {(form.interestArea && !areaOptions.includes(form.interestArea) ? [...areaOptions, form.interestArea] : areaOptions).map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor={`${id}-mode`}>Modalidade</label>
              <select id={`${id}-mode`} value={form.workMode} onChange={(e) => set("workMode", e.target.value)} className="input">
                <option value="">Tanto faz</option><option value="REMOTE">Remoto</option><option value="HYBRID">Híbrido</option><option value="ONSITE">Presencial</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor={`${id}-city`}>Cidade</label>
              <input id={`${id}-city`} value={form.location} list={`${id}-cities`} onChange={(e) => set("location", e.target.value)} className="input" placeholder="Ex.: Recife" autoComplete="off" />
              <datalist id={`${id}-cities`}>{cityOptions.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="label" htmlFor={`${id}-years`}>Anos de experiência</label>
              <input id={`${id}-years`} type="number" min={0} max={60} inputMode="numeric" value={form.yearsExperience}
                onChange={(e) => set("yearsExperience", Math.max(0, Math.min(60, Number(e.target.value) || 0)))} className="input" />
            </div>
          </div>
          {error && <p role="alert" className="rounded-control border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary flex-1 sm:flex-none" disabled={busy}>{busy ? "Analisando…" : "Analisar vagas"}</button>
            {prefill && <button type="button" className="btn-ghost" onClick={() => { setForm(prefill); setDraft(""); }}>Usar meu perfil</button>}
            {(form.skills.length > 0 || result) && <button type="button" className="btn-ghost" onClick={() => { setForm(EMPTY); setResult(null); setDraft(""); setError(null); }}>Limpar</button>}
          </div>
        </form>

        {result && (
          <div ref={resultRef} className="scroll-mt-24 space-y-4" aria-live="polite">
            <p className="text-sm text-abyss/70">Analisamos {result.analyzed} {result.analyzed === 1 ? "vaga aberta" : "vagas abertas"} e 20 áreas do mercado.</p>

            {top && (
              <section className="card" aria-labelledby={`${id}-area-title`}>
                <h3 id={`${id}-area-title`} className="text-sm font-medium text-abyss/70">Área recomendada para você</h3>
                <div className="mt-2 flex items-start gap-4">
                  <Pct value={top.score} size="lg" />
                  <div className="min-w-0">
                    <p className="font-display text-xl font-semibold leading-tight">{top.name}</p>
                    <p className="mt-1 text-sm text-abyss/80">{top.reason}</p>
                    <p className="mt-1 text-xs text-abyss/65">Demanda no mercado: <span className="font-semibold text-abyss">{top.demand}</span>{top.nextSkills.length > 0 && <> · Para crescer: {top.nextSkills.join(", ")}</>}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/mercado?area=${top.id}`} className="btn-ghost">O que o mercado pede</Link>
                  {top.jobsInArea > 0 && <Link href={`/jobs?mercado=${top.id}`} className="btn-ghost">Vagas da área</Link>}
                </div>
                {result.areas.length > 1 && (
                  <ul className="mt-4 space-y-2 border-t border-mist pt-4">
                    {result.areas.slice(1).map((a) => (
                      <li key={a.id} className="flex items-center gap-3">
                        <Link href={`/mercado?area=${a.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-tide hover:underline">{a.name}</Link>
                        <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-mist/70 sm:w-28" aria-hidden="true"><span className="block h-full rounded-full bg-tide" style={{ width: `${Math.max(4, a.score)}%` }} /></span>
                        <span className="tabular w-10 shrink-0 text-right text-sm font-semibold">{a.score}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className="card p-0" aria-labelledby={`${id}-jobs-title`}>
              <h3 id={`${id}-jobs-title`} className="border-b border-mist px-5 py-3 text-sm font-medium text-abyss/70">Vagas recomendadas</h3>
              {result.jobs.length === 0 ? <p className="p-5 text-sm text-abyss/70">Nenhuma vaga aberta no momento.</p> : (
                <ul className="divide-y divide-mist">
                  {result.jobs.map((j) => (
                    <li key={j.id} className="flex items-start gap-3 px-5 py-3.5">
                      <Pct value={j.score} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/jobs/${j.id}`} className="font-semibold leading-snug hover:text-tide hover:underline">{j.title}</Link>
                        <p className="truncate text-xs text-abyss/70">{j.company}{j.demo ? " (demo)" : ""} · {j.location} · {j.workMode}{j.salary ? ` · ${j.salary}` : ""}</p>
                        {j.missing.length > 0 && <p className="mt-1 text-xs text-abyss/70">Falta: <span className="text-coral">{j.missing.slice(0, 4).join(", ")}</span></p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {result.skillsToLearn.length > 0 && (
              <section className="card" aria-labelledby={`${id}-learn-title`}>
                <h3 id={`${id}-learn-title`} className="text-sm font-medium text-abyss/70">Habilidades que mais abririam portas</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {result.skillsToLearn.map((s) => (
                    <li key={s.name} className="chip inline-flex items-center gap-1.5 py-1 text-sm">{s.name}<span className="tabular text-abyss/60">+{s.jobs} {s.jobs === 1 ? "vaga" : "vagas"}</span></li>
                  ))}
                </ul>
              </section>
            )}

            {!prefill && <p className="text-sm text-abyss/75">Gostou? <Link href="/register" className="font-semibold text-tide hover:underline">Crie sua conta</Link> para salvar o perfil e ver a compatibilidade em todas as vagas.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
