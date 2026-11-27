"use client";
// Formulários dos diferenciais: cotas e CNPJ, provas de habilidade, projetos validados por
// professor, contato (CEP e WhatsApp), acompanhamento pós-contratação e o guia do primeiro emprego.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";
import { Msg } from "@/components/forms";

type Fields = Record<string, string[]> | undefined;
type ErrData = { error?: string; fields?: Record<string, string[]> };
const FieldErr = ({ f, k }: { f: Fields; k: string }) => <Msg error={f?.[k]?.[0]} />;
const digits = (v: string) => v.replace(/\D/g, "");
const maskCep = (v: string) => { const d = digits(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
const maskCnpj = (v: string) => {
  const d = digits(v).slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
};

/* ---------- Empresa: cotas e CNPJ ---------- */

export function ComplianceForm({ initial, sizes }: {
  initial: { cnpj: string; companySize: string; employees: number | ""; apprentices: number; pcdEmployees: number };
  sizes: Record<string, string>;
}) {
  const router = useRouter();
  const [s, setS] = useState<{ busy?: boolean; error?: string; ok?: string; fields?: Fields }>({});
  const [cnpj, setCnpj] = useState(maskCnpj(initial.cnpj));
  return (
    <form className="card space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
      const r = await api<{ verified: boolean; legalName: string | null; notice: string | null }>("PUT", "/api/company/compliance", f);
      if (r.ok) {
        const d = r.data as { verified: boolean; legalName: string | null; notice: string | null };
        setS({ ok: d.notice ?? (d.verified ? `Dados salvos. CNPJ ativo: ${d.legalName ?? "empresa verificada"}.` : "Dados salvos.") });
        router.refresh();
      } else { const d = r.data as ErrData; setS({ error: d.error, fields: d.fields }); }
    }}>
      <h2 className="font-display text-lg font-semibold">Dados da empresa</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="cnpj">CNPJ</label>
          <input id="cnpj" name="cnpj" inputMode="numeric" autoComplete="off" value={cnpj} onChange={(e) => setCnpj(maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="input" aria-describedby="cnpj-hint" />
          <FieldErr f={s.fields} k="cnpj" />
          <p id="cnpj-hint" className="mt-1.5 text-xs text-abyss/60">Consultamos a situação na base pública da Receita (BrasilAPI). CNPJ ativo ganha o selo &quot;Empresa verificada&quot; nas vagas.</p></div>
        <div><label className="label" htmlFor="companySize">Porte</label>
          <select id="companySize" name="companySize" defaultValue={initial.companySize || "ME"} className="input">{Object.entries(sizes).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="employees">Total de funcionários</label>
          <input id="employees" name="employees" type="number" min={0} required defaultValue={initial.employees} className="input" /><FieldErr f={s.fields} k="employees" /></div>
        <div><label className="label" htmlFor="apprentices">Aprendizes contratados hoje</label>
          <input id="apprentices" name="apprentices" type="number" min={0} defaultValue={initial.apprentices} className="input" /></div>
        <div><label className="label" htmlFor="pcdEmployees">Pessoas com deficiência contratadas hoje</label>
          <input id="pcdEmployees" name="pcdEmployees" type="number" min={0} defaultValue={initial.pcdEmployees} className="input" /></div>
      </div>
      <Msg error={s.error} ok={s.ok} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Consultando..." : "Salvar e calcular"}</button>
    </form>
  );
}

/* ---------- Candidato: prova de habilidade ---------- */

type Started = { id: string; skill: string; timeLimitMin: number; questions: { prompt: string; options: string[] }[] };
type Result = { score: number; total: number; passed: boolean; late: boolean; skill: string };

export function SkillQuiz({ slug, name, disabledReason }: { slug: string; name: string; disabledReason?: string | null }) {
  const router = useRouter();
  const [check, setCheck] = useState<Started | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const deadline = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  const submit = async (id: string, a: number[]) => {
    setBusy(true);
    const r = await api<Result>("POST", `/api/skill-checks/${id}`, { answers: a.map((x) => (x < 0 ? 0 : x)) });
    setBusy(false);
    if (r.ok) { setResult(r.data as Result); setCheck(null); router.refresh(); } else setError((r.data as ErrData).error ?? "Erro ao enviar.");
  };

  useEffect(() => {
    if (!check) return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) { clearInterval(t); submit(check.id, answers); }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check, answers]);

  if (result) return (
    <div role="status" className={`rounded-control border p-4 text-sm ${result.passed ? "border-reef/50 bg-reef/10" : "border-mist"}`}>
      <p className="font-semibold">{result.passed ? `Aprovado em ${result.skill}: ${result.score} de ${result.total}.` : result.late ? "O tempo acabou antes do envio." : `Você acertou ${result.score} de ${result.total}.`}</p>
      <p className="mt-1 text-abyss/75">{result.passed ? "A habilidade aparece como comprovada no seu currículo e para as empresas." : "Para passar são 4 acertos. Você pode tentar de novo em 7 dias; estude o tema enquanto isso."}</p>
    </div>
  );
  if (!check) return (
    <div>
      {disabledReason ? <p className="text-sm text-abyss/70">{disabledReason}</p> :
        <button className="btn-primary" disabled={busy} onClick={async () => {
          setError(""); setBusy(true);
          const r = await api<Started>("POST", "/api/skill-checks", { skill: slug });
          setBusy(false);
          if (!r.ok) { setError((r.data as ErrData).error ?? "Erro."); return; }
          const d = r.data as Started;
          deadline.current = Date.now() + d.timeLimitMin * 60_000; setLeft(d.timeLimitMin * 60);
          setAnswers(d.questions.map(() => -1)); setCheck(d);
          setTimeout(() => box.current?.focus(), 50);
        }}>{busy ? "Preparando..." : `Começar a prova de ${name}`}</button>}
      <Msg error={error} />
    </div>
  );
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  return (
    <div ref={box} tabIndex={-1} className="space-y-5 outline-none">
      <p className={`tabular sticky top-20 z-10 inline-block shadow-sm rounded-full border px-3 py-1 text-sm font-semibold ${left < 60 ? "border-coral/50 bg-coral/10 text-coral" : "border-mist bg-casco"}`} aria-live={left < 60 ? "polite" : "off"}>Tempo restante {mm}:{ss}</p>
      <ol className="space-y-5">{check.questions.map((q, i) => (
        <li key={i}><fieldset><legend className="font-medium">{i + 1}. {q.prompt}</legend>
          <div className="mt-2 space-y-1.5">{q.options.map((o, j) => (
            <label key={j} className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-control border px-3 py-2 text-sm ${answers[i] === j ? "border-tide bg-tide/10" : "border-mist"}`}>
              <input type="radio" name={`q${i}`} checked={answers[i] === j} onChange={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))} className="h-4 w-4 accent-tide" />{o}</label>))}</div>
        </fieldset></li>))}</ol>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={busy || answers.some((a) => a < 0)} onClick={() => submit(check.id, answers)}>{busy ? "Enviando..." : "Enviar respostas"}</button>
        {answers.some((a) => a < 0) && <p className="text-sm text-abyss/70">Responda todas as {check.questions.length} questões para enviar.</p>}
      </div>
      <Msg error={error} />
    </div>
  );
}

/* ---------- Candidato: projetos validados pelo professor ---------- */

export function ProjectForm() {
  const router = useRouter();
  const [s, setS] = useState<{ busy?: boolean; error?: string; fields?: Fields; link?: string; emailed?: boolean }>({});
  const [copied, setCopied] = useState(false);
  if (s.link) return (
    <div role="status" className="space-y-3 rounded-control border border-reef/50 bg-reef/10 p-4 text-sm">
      <p className="font-semibold">Projeto cadastrado.</p>
      <p className="text-abyss/80">{s.emailed ? "Enviamos o pedido de confirmação ao e-mail do professor. " : ""}Mande também este link para o professor; ele confirma em um clique, sem criar conta. O link vale uma vez.</p>
      <input readOnly value={s.link} className="input font-mono text-xs" aria-label="Link de confirmação" onFocus={(e) => e.currentTarget.select()} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={async () => { try { await navigator.clipboard.writeText(s.link!); setCopied(true); } catch { setCopied(false); } }}>{copied ? "Copiado" : "Copiar link"}</button>
        <a className="btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Professor(a), pode confirmar meu projeto no Nautiwork? É um clique: ${s.link}`)}`}>Enviar pelo WhatsApp</a>
        <button type="button" className="btn-ghost" onClick={() => setS({})}>Cadastrar outro</button>
      </div>
    </div>
  );
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const form = e.currentTarget;
      const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
      const r = await api<{ link: string; emailed: boolean }>("POST", "/api/projects", { ...f, url: f.url || undefined });
      if (r.ok) { const d = r.data as { link: string; emailed: boolean }; setS({ link: d.link, emailed: d.emailed }); form.reset(); router.refresh(); }
      else { const d = r.data as ErrData; setS({ error: d.error, fields: d.fields }); }
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="p-title">Nome do projeto</label><input id="p-title" name="title" required maxLength={120} className="input" placeholder="Sistema de agendamento da cantina" /><FieldErr f={s.fields} k="title" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="p-desc">O que você fez</label><textarea id="p-desc" name="description" required rows={4} maxLength={2000} className="input py-2" placeholder="O problema, o que você construiu, as tecnologias e qual foi a sua parte." /><FieldErr f={s.fields} k="description" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="p-url">Link (opcional)</label><input id="p-url" name="url" type="url" className="input" placeholder="https://github.com/..." /><FieldErr f={s.fields} k="url" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="p-school">Escola ou curso</label><input id="p-school" name="school" required className="input" /><FieldErr f={s.fields} k="school" /></div>
        <div><label className="label" htmlFor="p-tname">Nome do professor</label><input id="p-tname" name="teacherName" required className="input" /><FieldErr f={s.fields} k="teacherName" /></div>
        <div><label className="label" htmlFor="p-temail">E-mail do professor</label><input id="p-temail" name="teacherEmail" type="email" required className="input" /><FieldErr f={s.fields} k="teacherEmail" /></div>
      </div>
      <Msg error={s.error} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Salvando..." : "Cadastrar e pedir confirmação"}</button>
    </form>
  );
}

export function DeleteProjectButton({ id }: { id: string }) {
  const router = useRouter(); const [error, setError] = useState("");
  return (
    <span>
      <button type="button" className="text-sm font-medium text-coral hover:underline" onClick={async () => {
        if (!confirm("Excluir este projeto do currículo?")) return;
        const r = await api("DELETE", `/api/projects/${id}`);
        if (r.ok) router.refresh(); else setError((r.data as ErrData).error ?? "Erro.");
      }}>Excluir</button>
      <Msg error={error} />
    </span>
  );
}

export function ValidateProjectForm({ token, teacherName }: { token: string; teacherName: string }) {
  const [s, setS] = useState<{ busy?: boolean; error?: string; fields?: Fields; done?: boolean }>({});
  if (s.done) return <p role="status" className="card text-sm"><span className="font-semibold">Obrigado.</span> O projeto agora aparece como confirmado por professor no currículo do aluno.</p>;
  return (
    <form className="card space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const fd = new FormData(e.currentTarget);
      const r = await api("POST", "/api/projects/validate", { token, teacherName: fd.get("teacherName"), confirm: fd.get("confirm") === "on", note: (fd.get("note") as string) || undefined });
      if (r.ok) setS({ done: true }); else { const d = r.data as ErrData; setS({ error: d.error, fields: d.fields }); }
    }}>
      <div><label className="label" htmlFor="v-name">Seu nome</label><input id="v-name" name="teacherName" required defaultValue={teacherName} className="input" /><FieldErr f={s.fields} k="teacherName" /></div>
      <div><label className="label" htmlFor="v-note">Comentário sobre o trabalho (opcional, aparece no currículo)</label><textarea id="v-note" name="note" rows={3} maxLength={500} className="input py-2" /></div>
      <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 text-sm"><input type="checkbox" name="confirm" required className="mt-1 h-4 w-4 accent-tide" />
        <span>Confirmo que acompanhei este projeto e que ele foi desenvolvido pelo aluno.</span></label>
      <FieldErr f={s.fields} k="confirm" />
      <Msg error={s.error} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Enviando..." : "Confirmar projeto"}</button>
    </form>
  );
}

/* ---------- Candidato: contato (CEP e WhatsApp) ---------- */

export function ContactForm({ initial }: { initial: { postalCode: string; whatsapp: string; whatsappOptIn: boolean } }) {
  const router = useRouter();
  const [s, setS] = useState<{ busy?: boolean; error?: string; ok?: string; fields?: Fields }>({});
  const [cep, setCep] = useState(maskCep(initial.postalCode));
  const [wa, setWa] = useState(initial.whatsapp);
  return (
    <form id="contato" className="card scroll-mt-24 space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const fd = new FormData(e.currentTarget);
      const r = await api<{ located?: boolean }>("PUT", "/api/profile/contact", { postalCode: cep || undefined, whatsapp: wa || undefined, whatsappOptIn: fd.get("whatsappOptIn") === "on" });
      if (r.ok) {
        const d = r.data as { located?: boolean };
        setS({ ok: cep && d.located === false ? "Salvo. Não achamos a localização deste CEP; o tempo até as vagas não vai aparecer." : "Salvo." }); router.refresh();
      } else { const d = r.data as ErrData; setS({ error: d.error, fields: d.fields }); }
    }}>
      <div><h2 className="font-display text-lg font-semibold">Contato e deslocamento</h2>
        <p className="mt-1 text-sm text-abyss/70">Opcional. Nada disso aparece na página pública.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-cep">CEP de casa</label>
          <input id="c-cep" inputMode="numeric" autoComplete="postal-code" value={cep} onChange={(e) => setCep(maskCep(e.target.value))} placeholder="00000-000" className="input" aria-describedby="c-cep-hint" />
          <FieldErr f={s.fields} k="postalCode" />
          <p id="c-cep-hint" className="mt-1.5 text-xs text-abyss/60">Usado só para estimar quanto tempo você levaria até cada vaga e para o filtro de distância.</p></div>
        <div><label className="label" htmlFor="c-wa">WhatsApp com DDD</label>
          <input id="c-wa" inputMode="tel" autoComplete="tel-national" value={wa} onChange={(e) => setWa(e.target.value.replace(/[^\d()\s-]/g, "").slice(0, 16))} placeholder="(11) 91234-5678" className="input" />
          <FieldErr f={s.fields} k="whatsapp" /></div>
      </div>
      <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 text-sm"><input type="checkbox" name="whatsappOptIn" defaultChecked={initial.whatsappOptIn} className="mt-1 h-4 w-4 accent-tide" />
        <span>Autorizo empresas para as quais eu me candidatei a me chamarem neste WhatsApp. <span className="text-abyss/60">Você pode desmarcar quando quiser.</span></span></label>
      <Msg error={s.error} ok={s.ok} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Salvando..." : "Salvar contato"}</button>
    </form>
  );
}

/* ---------- Acompanhamento de 30, 60 e 90 dias ---------- */

export function CheckinForm({ id, role, day, other }: { id: string; role: "CANDIDATE" | "COMPANY"; day: number; other: string }) {
  const router = useRouter();
  const [s, setS] = useState<{ busy?: boolean; error?: string; done?: boolean }>({});
  const q = role === "CANDIDATE" ? `Depois de ${day} dias, como está o trabalho na ${other}?` : `Depois de ${day} dias, como está a adaptação de ${other}?`;
  if (s.done) return <p role="status" className="card text-sm"><span className="font-semibold">Resposta registrada.</span> {role === "CANDIDATE" ? "Sua nota não é mostrada à empresa." : "Obrigado."} <Link href={role === "CANDIDATE" ? "/candidate/dashboard" : "/company/dashboard"} className="font-medium text-tide hover:underline">Voltar ao painel</Link></p>;
  return (
    <form className="card space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const fd = new FormData(e.currentTarget);
      const r = await api("POST", `/api/checkins/${id}`, { score: Number(fd.get("score")), wantsTalk: fd.get("wantsTalk") === "on", comment: (fd.get("comment") as string) || undefined });
      if (r.ok) { setS({ done: true }); router.refresh(); } else setS({ error: (r.data as ErrData).error ?? "Erro." });
    }}>
      <fieldset><legend className="font-medium">{q}</legend>
        <div className="mt-3 grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex min-h-[56px] cursor-pointer flex-col items-center justify-center rounded-control border border-mist text-sm has-[:checked]:border-tide has-[:checked]:bg-tide/10">
            <input type="radio" name="score" value={n} required className="sr-only" /><span className="tabular text-lg font-semibold">{n}</span>
            <span className="text-[11px] text-abyss/60">{["Muito ruim", "Ruim", "Ok", "Bom", "Muito bom"][n - 1]}</span></label>))}</div>
      </fieldset>
      {role === "CANDIDATE" && <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 text-sm"><input type="checkbox" name="wantsTalk" className="mt-1 h-4 w-4 accent-tide" />
        <span>Quero conversar com a empresa sobre algo. <span className="text-abyss/60">A empresa só recebe um aviso de que você quer conversar; a nota fica com você.</span></span></label>}
      <div><label className="label" htmlFor="ck-comment">Comentário (opcional{role === "CANDIDATE" ? ", só você vê" : ""})</label><textarea id="ck-comment" name="comment" rows={3} maxLength={1000} className="input py-2" /></div>
      <Msg error={s.error} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Enviando..." : "Enviar"}</button>
    </form>
  );
}

/* ---------- Guia do primeiro emprego: checklist salvo no aparelho ---------- */

export function Checklist({ id, items }: { id: string; items: { key: string; label: string; hint?: string; href?: string }[] }) {
  const storeKey = `nw-checklist-${id}`;
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem(storeKey) ?? "[]")); } catch { /* sem armazenamento: começa vazio */ } }, [storeKey]);
  const toggle = (k: string) => setDone((d) => {
    const next = d.includes(k) ? d.filter((x) => x !== k) : [...d, k];
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* ignora */ }
    return next;
  });
  return (
    <div>
      <p className="tabular text-sm text-abyss/70" aria-live="polite">{done.filter((k) => items.some((i) => i.key === k)).length} de {items.length} feitos</p>
      <ul className="mt-3 space-y-2">{items.map((it) => (
        <li key={it.key}><label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-control border border-mist p-3 has-[:checked]:border-reef/50 has-[:checked]:bg-reef/5">
          <input type="checkbox" checked={done.includes(it.key)} onChange={() => toggle(it.key)} className="mt-1 h-4 w-4 accent-tide" />
          <span><span className="font-medium">{it.label}</span>{it.hint && <span className="mt-0.5 block text-sm text-abyss/70">{it.hint}</span>}
            {it.href && <a href={it.href} target={it.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="mt-1 inline-block text-sm font-medium text-tide hover:underline">{it.href.startsWith("http") ? "Abrir o site oficial" : "Ir agora"}</a>}</span>
        </label></li>))}</ul>
    </div>
  );
}
