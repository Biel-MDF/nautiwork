"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { api } from "@/lib/client";
import Link from "next/link";

export function Msg({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <p role="alert" className="hint-error">{error}</p>;
  if (ok) return <p role="status" className="mt-1 text-sm text-reef">{ok}</p>;
  return null;
}
const csv = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [show, setShow] = useState(false);
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setError("");
      const f = new FormData(e.currentTarget);
      const res = await signIn("credentials", { email: f.get("email"), password: f.get("password"), redirect: false });
      setBusy(false);
      if (res?.error) return setError("E-mail ou senha incorretos, ou conta desativada.");
      router.push("/"); router.refresh();
    }}>
      <label className="sr-only" htmlFor="email">E-mail</label>
      <input id="email" name="email" type="email" required autoComplete="email" placeholder="E-mail" className="input min-h-[52px] px-4 text-base" />
      <div className="relative">
        <label className="sr-only" htmlFor="password">Senha</label>
        <input id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" placeholder="Senha"
          className="input min-h-[52px] px-4 pr-24 text-base" />
        <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-controls="password"
          className="absolute right-1 top-1/2 min-h-[44px] -translate-y-1/2 rounded-[7px] px-3 text-sm font-medium text-abyss/70 hover:bg-foam hover:text-abyss">
          {show ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      <div className="pt-1"><Link className="tap text-sm text-abyss/70 hover:text-tide hover:underline" href="/forgot-password">Esqueceu sua senha?</Link></div>
      <Msg error={error} />
      <button className="btn-primary min-h-[52px] w-full text-base" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</button>
    </form>
  );
}

export function RegisterForm({ initialRole = "CANDIDATE" }: { initialRole?: "CANDIDATE" | "COMPANY" }) {
  const router = useRouter();
  const [role, setRole] = useState<"CANDIDATE" | "COMPANY">(initialRole);
  const [err, setErr] = useState<{ error?: string; fields?: Record<string, string[]> }>({}); const [busy, setBusy] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr({});
      const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
      const r = await api("POST", "/api/register", { ...f, role, acceptTerms: f.acceptTerms === "on" });
      if (!r.ok) { setBusy(false); return setErr(r.data); }
      await signIn("credentials", { email: f.email, password: f.password, redirect: false });
      router.push(role === "CANDIDATE" ? "/candidate/profile" : "/company/jobs/new"); router.refresh();
    }}>
      <div className="grid grid-cols-2 gap-1 rounded-control border border-mist bg-fossa p-1" role="radiogroup" aria-label="Tipo de conta">
        {(["CANDIDATE", "COMPANY"] as const).map((r) => (
          <button type="button" key={r} role="radio" aria-checked={role === r} onClick={() => setRole(r)}
            className={`min-h-[40px] rounded-[7px] text-sm font-semibold transition-colors ${role === r ? "bg-foam text-abyss shadow-[inset_0_0_0_1px_rgb(var(--c-tide)/0.45)]" : "text-abyss/65 hover:text-abyss"}`}>
            {r === "CANDIDATE" ? "Procuro vaga" : "Sou empresa"}</button>
        ))}
      </div>
      <div><label className="label" htmlFor="name">Seu nome</label><input id="name" name="name" required className="input" /><Msg error={err.fields?.name?.[0]} /></div>
      {role === "COMPANY" && <div><label className="label" htmlFor="companyName">Nome da empresa</label><input id="companyName" name="companyName" required className="input" /><Msg error={err.fields?.companyName?.[0]} /></div>}
      <div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /><Msg error={err.fields?.email?.[0]} /></div>
      <div><label className="label" htmlFor="password">Senha</label><input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" /><p className="mt-1 text-xs text-abyss/60">Mínimo de 8 caracteres, com letras e números.</p><Msg error={err.fields?.password?.[0]} /></div>
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-abyss/80">
          <input type="checkbox" name="acceptTerms" required className="mt-0.5 h-5 w-5 shrink-0 accent-tide" />
          <span>Li e aceito os <Link href="/termos" target="_blank" className="font-semibold text-tide hover:underline">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank" className="font-semibold text-tide hover:underline">Política de Privacidade</Link>.</span>
        </label>
        <Msg error={err.fields?.acceptTerms?.[0]} />
      </div>
      <Msg error={err.error && !err.fields ? err.error : undefined} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Criando conta..." : "Criar conta"}</button>
    </form>
  );
}

export function ApplyButton({ jobId, applied, loggedIn }: { jobId: string; applied: boolean; loggedIn: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; error?: string; done: boolean }>({ busy: false, done: applied });
  if (!loggedIn) return <a href="/login" className="btn-primary">Entre para se candidatar</a>;
  if (state.done) return <p role="status" className="font-semibold text-reef">Candidatura enviada. Acompanhe em Candidaturas.</p>;
  return (
    <div>
      <button className="btn-primary" disabled={state.busy} onClick={async () => {
        setState({ busy: true, done: false });
        const r = await api("POST", "/api/applications", { jobId });
        if (r.ok) { setState({ busy: false, done: true }); router.refresh(); }
        else setState({ busy: false, done: false, error: r.data.error });
      }}>{state.busy ? "Enviando..." : "Candidatar-se"}</button>
      <Msg error={state.error} />
    </div>
  );
}

export function SaveButton({ jobId, saved }: { jobId: string; saved: boolean }) {
  const router = useRouter(); const [on, setOn] = useState(saved); const [error, setError] = useState("");
  return (
    <div>
      <button className="btn-ghost" aria-pressed={on} onClick={async () => {
        const r = await api<{ saved: boolean }>("POST", "/api/saved-jobs", { jobId });
        if (r.ok) { setOn(r.data.saved); router.refresh(); } else setError(r.data.error ?? "Não foi possível salvar.");
      }}>{on ? "Salva" : "Salvar vaga"}</button>
      <Msg error={error} />
    </div>
  );
}

export function WithdrawButton({ id }: { id: string }) {
  const router = useRouter(); const [error, setError] = useState("");
  return (
    <div>
      <button className="btn-danger" onClick={async () => {
        if (!confirm("Retirar esta candidatura?")) return;
        const r = await api("DELETE", `/api/applications/${id}`);
        if (r.ok) router.refresh(); else setError(r.data.error ?? "Erro ao retirar.");
      }}>Retirar</button>
      <Msg error={error} />
    </div>
  );
}

export function ProfileForm({ initial }: { initial: { headline: string; about: string; location: string; interestArea: string; workMode: string; objective: string; yearsExperience: number; skills: string } }) {
  const [state, setState] = useState<{ busy?: boolean; ok?: string; error?: string; fields?: Record<string, string[]> }>({});
  return (
    <form className="card space-y-6 p-6 sm:p-8" onSubmit={async (e) => {
      e.preventDefault(); setState({ busy: true });
      const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
      const r = await api("PUT", "/api/profile", { ...f, workMode: f.workMode || undefined, skills: csv(f.skills) });
      setState(r.ok ? { ok: "Perfil salvo." } : { error: r.data.error, fields: r.data.fields });
    }}>
      <div><label className="label" htmlFor="headline">Título profissional</label><input id="headline" name="headline" defaultValue={initial.headline} className="input" placeholder="Ex.: Desenvolvedora front-end" /><Msg error={state.fields?.headline?.[0]} /></div>
      <div><label className="label" htmlFor="about">Sobre você</label><textarea id="about" name="about" defaultValue={initial.about} rows={4} className="input py-2" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="location">Cidade</label><input id="location" name="location" defaultValue={initial.location} className="input" /></div>
        <div><label className="label" htmlFor="interestArea">Área de interesse</label><input id="interestArea" name="interestArea" defaultValue={initial.interestArea} className="input" placeholder="Tecnologia" /></div>
        <div><label className="label" htmlFor="workMode">Modalidade preferida</label>
          <select id="workMode" name="workMode" defaultValue={initial.workMode} className="input"><option value="">Sem preferência</option><option value="REMOTE">Remoto</option><option value="HYBRID">Híbrido</option><option value="ONSITE">Presencial</option></select></div>
        <div><label className="label" htmlFor="yearsExperience">Anos de experiência</label><input id="yearsExperience" name="yearsExperience" type="number" min={0} defaultValue={initial.yearsExperience} className="input" /></div>
      </div>
      <div><label className="label" htmlFor="skills">Habilidades (separe por vírgula)</label><input id="skills" name="skills" defaultValue={initial.skills} className="input" placeholder="React, TypeScript, SQL" /></div>
      <div><label className="label" htmlFor="objective">Objetivo profissional</label><textarea id="objective" name="objective" defaultValue={initial.objective} rows={2} className="input py-2" /></div>
      <Msg error={state.error} ok={state.ok} />
      <button className="btn-primary" disabled={state.busy}>{state.busy ? "Salvando..." : "Salvar perfil"}</button>
    </form>
  );
}

type JobInitial = Record<string, string | number | boolean | undefined>;
export function JobForm({ jobId, initial = {} }: { jobId?: string; initial?: JobInitial }) {
  const router = useRouter();
  const [state, setState] = useState<{ busy?: boolean; error?: string; fields?: Record<string, string[]>; held?: boolean }>({});
  const v = (k: string) => (initial[k] ?? "") as string;
  const Err = ({ k }: { k: string }) => <Msg error={state.fields?.[k]?.[0]} />;
  if (state.held) return (
    <div role="status" className="card space-y-3">
      <h2 className="font-display text-lg font-semibold">Vaga salva e em análise</h2>
      <p className="text-sm text-abyss/80">O texto tem sinais que também aparecem em golpes (por exemplo, contato direto por telefone ou WhatsApp, ou promessa de renda extra). A vaga fica fora do ar até a equipe conferir; você recebe uma notificação. Se foi engano, edite o texto e tire esses trechos.</p>
      <div className="flex flex-wrap gap-2"><a href="/company/jobs" className="btn-primary">Ver minhas vagas</a></div>
    </div>
  );
  return (
    <form className="card space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setState({ busy: true });
      const fd = new FormData(e.currentTarget);
      const f = Object.fromEntries(fd) as Record<string, string>;
      const body = { ...f, salaryMin: f.salaryMin || undefined, salaryMax: f.salaryMax || undefined, skills: csv(f.skills),
        forApprentice: fd.get("forApprentice") === "on", pcdOnly: fd.get("pcdOnly") === "on", postalCode: f.postalCode || undefined };
      const r = await api<{ flagged?: boolean }>(jobId ? "PATCH" : "POST", jobId ? `/api/jobs/${jobId}` : "/api/jobs", body);
      if (r.ok && (r.data as { flagged?: boolean }).flagged) { setState({ held: true }); router.refresh(); }
      else if (r.ok) { router.push("/company/jobs"); router.refresh(); }
      else setState({ error: r.data.error, fields: r.data.fields });
    }}>
      <fieldset className="space-y-4"><legend className="mb-4 font-display text-lg font-semibold">A vaga</legend>
      <div><label className="label" htmlFor="title">Cargo</label><input id="title" name="title" required defaultValue={v("title")} className="input" /><Err k="title" /></div>
      <div><label className="label" htmlFor="description">Descrição</label><textarea id="description" name="description" required rows={5} defaultValue={v("description")} className="input py-2" /><Err k="description" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="responsibilities">Responsabilidades</label><textarea id="responsibilities" name="responsibilities" rows={3} defaultValue={v("responsibilities")} className="input py-2" /><Err k="responsibilities" /></div>
        <div><label className="label" htmlFor="requirements">Requisitos</label><textarea id="requirements" name="requirements" rows={3} defaultValue={v("requirements")} className="input py-2" /><Err k="requirements" /></div>
      </div>
      <div><label className="label" htmlFor="benefits">Benefícios</label><input id="benefits" name="benefits" defaultValue={v("benefits")} className="input" /></div>
      </fieldset>
      <hr className="border-mist" />
      <fieldset className="space-y-4"><legend className="mb-4 font-display text-lg font-semibold">Condições</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="area">Área</label><input id="area" name="area" required defaultValue={v("area")} className="input" placeholder="Tecnologia" /><Err k="area" /></div>
        <div><label className="label" htmlFor="location">Cidade</label><input id="location" name="location" required defaultValue={v("location")} className="input" /><Err k="location" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="postalCode">CEP do local de trabalho <span className="font-normal text-abyss/60">(opcional)</span></label><input id="postalCode" name="postalCode" inputMode="numeric" autoComplete="off" maxLength={9} placeholder="00000-000" defaultValue={v("postalCode")} className="input sm:max-w-[200px]" aria-describedby="cep-hint" /><Err k="postalCode" />
          <p id="cep-hint" className="mt-1.5 text-xs text-abyss/60">Com o CEP, quem procura vaga vê quanto tempo leva de casa até aqui. O endereço exato não aparece.</p></div>
        <div><label className="label" htmlFor="workMode">Modalidade</label><select id="workMode" name="workMode" defaultValue={v("workMode") || "REMOTE"} className="input"><option value="REMOTE">Remoto</option><option value="HYBRID">Híbrido</option><option value="ONSITE">Presencial</option></select></div>
        <div><label className="label" htmlFor="contractType">Contratação</label><select id="contractType" name="contractType" defaultValue={v("contractType") || "CLT"} className="input"><option value="CLT">CLT</option><option value="PJ">PJ</option><option value="INTERNSHIP">Estágio</option><option value="TEMPORARY">Temporário</option></select><Err k="contractType" /></div>
        <div><label className="label" htmlFor="seniority">Senioridade</label><select id="seniority" name="seniority" defaultValue={v("seniority") || "MID"} className="input"><option value="INTERN">Estagiário</option><option value="JUNIOR">Júnior</option><option value="MID">Pleno</option><option value="SENIOR">Sênior</option><option value="LEAD">Liderança</option></select></div>
        <div><label className="label" htmlFor="minYears">Anos de experiência mínimos</label><input id="minYears" name="minYears" type="number" min={0} defaultValue={v("minYears") || 0} className="input" /><Err k="minYears" /></div>
        <div><label className="label" htmlFor="salaryMin">Salário mínimo (R$)</label><input id="salaryMin" name="salaryMin" type="number" min={1} required defaultValue={v("salaryMin")} className="input" aria-describedby="salary-hint" /><Err k="salaryMin" /></div>
        <div><label className="label" htmlFor="salaryMax">Salário máximo (R$)</label><input id="salaryMax" name="salaryMax" type="number" min={1} required defaultValue={v("salaryMax")} className="input" aria-describedby="salary-hint" /><Err k="salaryMax" /></div>
        <p id="salary-hint" className="text-xs text-abyss/60 sm:col-span-2">A faixa salarial é obrigatória. Vagas com salário recebem mais candidaturas, e o candidato decide com informação real.</p>
      </div>
      <div className="space-y-2 rounded-control border border-mist p-3">
        <label className="flex min-h-[40px] cursor-pointer items-start gap-2.5"><input type="checkbox" name="forApprentice" defaultChecked={!!initial.forApprentice} className="mt-1 h-4 w-4 accent-tide" />
          <span><span className="font-medium">Vaga de Jovem Aprendiz</span><span className="block text-xs text-abyss/60">Contrato de aprendizagem (CLT), para 14 a 24 anos, sem exigir experiência. Conta para a cota de aprendizes.</span></span></label>
        <label className="flex min-h-[40px] cursor-pointer items-start gap-2.5"><input type="checkbox" name="pcdOnly" defaultChecked={!!initial.pcdOnly} className="mt-1 h-4 w-4 accent-tide" />
          <span><span className="font-medium">Vaga exclusiva para pessoas com deficiência (PcD)</span><span className="block text-xs text-abyss/60">Conta para a cota da Lei 8.213/91. Descreva as adaptações do posto, se houver.</span></span></label>
      </div>
      </fieldset>
      <hr className="border-mist" />
      <fieldset><legend className="mb-4 font-display text-lg font-semibold">Habilidades</legend>
      <div><label className="label" htmlFor="skills">Habilidades que a vaga pede</label><input id="skills" name="skills" defaultValue={v("skills")} className="input" placeholder="React, TypeScript, Git" aria-describedby="skills-hint" /><p id="skills-hint" className="mt-1.5 text-xs text-abyss/60">Separe por vírgula. Elas entram no cálculo de compatibilidade, com o maior peso.</p></div>
      </fieldset>
      <Msg error={state.error} />
      <button className="btn-primary" disabled={state.busy}>{state.busy ? "Salvando..." : jobId ? "Salvar alterações" : "Publicar vaga"}</button>
    </form>
  );
}

export function StatusSelect({ id, current, reasons, jobSkills = [], missing = [] }: {
  id: string; current: string; reasons: Record<string, string>; jobSkills?: string[]; missing?: string[];
}) {
  const router = useRouter(); const [error, setError] = useState(""); const [rejecting, setRejecting] = useState(false); const [busy, setBusy] = useState(false);
  const opts = [["IN_REVIEW", "Em análise"], ["IN_PROCESS", "Em processo seletivo"], ["INTERVIEW", "Entrevista"], ["APPROVED", "Aprovada"], ["REJECTED", "Recusar com retorno"]];
  const send = async (body: Record<string, unknown>) => {
    setError(""); setBusy(true); const r = await api("PATCH", `/api/applications/${id}`, body); setBusy(false);
    if (r.ok) { setRejecting(false); router.refresh(); } else setError(r.data.error ?? "Erro ao atualizar.");
  };
  return (
    <div className="w-full sm:w-auto">
      <label className="sr-only" htmlFor={`st-${id}`}>Mudar etapa</label>
      <select id={`st-${id}`} className="input min-w-[210px]" value="" disabled={current === "WITHDRAWN" || busy}
        onChange={(e) => { if (e.target.value === "REJECTED") setRejecting(true); else send({ status: e.target.value }); }}>
        <option value="" disabled>Mudar etapa</option>
        {opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      {rejecting && (
        <form className="mt-3 space-y-3 rounded-control border border-mist p-3 text-sm" onSubmit={(e) => {
          e.preventDefault(); const fd = new FormData(e.currentTarget);
          send({ status: "REJECTED", reason: fd.get("reason"), missingSkills: fd.getAll("missing").map(String) });
        }}>
          <p className="text-abyss/80">O candidato recebe o motivo e, para cada habilidade marcada, cursos gratuitos para aprender. Ninguém fica sem resposta.</p>
          <div><label className="label" htmlFor={`rr-${id}`}>Motivo</label>
            <select id={`rr-${id}`} name="reason" required defaultValue="" className="input"><option value="" disabled>Escolha o motivo</option>
              {Object.entries(reasons).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          {jobSkills.length > 0 && <fieldset><legend className="label">Habilidades a desenvolver (opcional)</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">{jobSkills.map((sk) => <label key={sk} className="flex min-h-[36px] cursor-pointer items-center gap-2"><input type="checkbox" name="missing" value={sk} defaultChecked={missing.includes(sk)} className="h-4 w-4 accent-tide" />{sk}</label>)}</div></fieldset>}
          <div className="flex flex-wrap gap-2"><button className="btn-danger" disabled={busy}>{busy ? "Enviando..." : "Recusar e enviar retorno"}</button>
            <button type="button" className="btn-ghost" onClick={() => setRejecting(false)}>Cancelar</button></div>
        </form>
      )}
      <Msg error={error} />
    </div>
  );
}

export function JobStatusButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const [error, setError] = useState("");
  const set = async (s: string) => {
    if (s === "CLOSED" && !confirm("Encerrar a vaga? Isso não pode ser desfeito.")) return;
    const r = await api("PATCH", `/api/jobs/${id}`, { status: s });
    if (r.ok) router.refresh(); else setError(r.data.error ?? "Erro.");
  };
  if (status === "CLOSED") return null;
  return (
    <div className="flex flex-wrap gap-2">
      {status === "ACTIVE" ? <button className="btn-ghost" onClick={() => set("PAUSED")}>Pausar</button> : <button className="btn-ghost" onClick={() => set("ACTIVE")}>Reativar</button>}
      <button className="btn-danger" onClick={() => set("CLOSED")}>Encerrar</button>
      <Msg error={error} />
    </div>
  );
}

/** "Ainda estou contratando": renova a validade da vaga por mais 30 dias. */
export function ConfirmJobButton({ id, label = "Ainda estou contratando" }: { id: string; label?: string }) {
  const router = useRouter(); const [state, setState] = useState<{ busy?: boolean; error?: string }>({});
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" className="btn-primary" disabled={state.busy} onClick={async () => {
        setState({ busy: true });
        const r = await api("POST", `/api/jobs/${id}/confirm`, {});
        if (r.ok) { setState({}); router.refresh(); } else setState({ error: r.data.error ?? "Erro." });
      }}>{state.busy ? "Confirmando..." : label}</button>
      <Msg error={state.error} />
    </span>
  );
}

export function AdminToggle({ url, field, value, onLabel, offLabel }: { url: string; field: string; value: boolean; onLabel: string; offLabel: string }) {
  const router = useRouter(); const [error, setError] = useState("");
  return (
    <div>
      <button className="btn-ghost" onClick={async () => {
        const r = await api("PATCH", url, { [field]: !value });
        if (r.ok) router.refresh(); else setError(r.data.error ?? "Erro.");
      }}>{value ? onLabel : offLabel}</button>
      <Msg error={error} />
    </div>
  );
}
