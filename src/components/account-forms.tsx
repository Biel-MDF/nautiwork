"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { api } from "@/lib/client";
import { Msg } from "./forms";

type Fields = Record<string, string[]>;
type State = { busy?: boolean; ok?: string; error?: string; fields?: Fields };
const formData = (e: React.FormEvent<HTMLFormElement>) =>
  Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
const monthValue = (iso: string | null) => (iso ? iso.slice(0, 7) : "");
const monthLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" }) : "atual";

/* ---------- Formação ---------- */

export type EducationItem = { id: string; institution: string; course: string; startYear: number; endYear: number | null };

function EducationForm({ item, onDone }: { item?: EducationItem; onDone: () => void }) {
  const router = useRouter();
  const [s, setS] = useState<State>({});
  const p = item ? `edu-${item.id}` : "edu-new";
  return (
    <form className="space-y-3 rounded-lg border border-mist bg-foam/50 p-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const r = await api(item ? "PATCH" : "POST", item ? `/api/profile/educations/${item.id}` : "/api/profile/educations", formData(e));
      if (!r.ok) return setS({ error: r.data.fields ? undefined : r.data.error, fields: r.data.fields });
      setS({}); onDone(); router.refresh();
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor={`${p}-course`}>Curso</label><input id={`${p}-course`} name="course" required defaultValue={item?.course} className="input" /><Msg error={s.fields?.course?.[0]} /></div>
        <div><label className="label" htmlFor={`${p}-inst`}>Instituição</label><input id={`${p}-inst`} name="institution" required defaultValue={item?.institution} className="input" /><Msg error={s.fields?.institution?.[0]} /></div>
        <div><label className="label" htmlFor={`${p}-start`}>Ano de início</label><input id={`${p}-start`} name="startYear" type="number" required min={1950} defaultValue={item?.startYear} className="input" /><Msg error={s.fields?.startYear?.[0]} /></div>
        <div><label className="label" htmlFor={`${p}-end`}>Ano de conclusão (vazio se em andamento)</label><input id={`${p}-end`} name="endYear" type="number" min={1950} defaultValue={item?.endYear ?? ""} className="input" /><Msg error={s.fields?.endYear?.[0]} /></div>
      </div>
      <Msg error={s.error} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={s.busy}>{s.busy ? "Salvando..." : item ? "Salvar formação" : "Adicionar formação"}</button>
        <button type="button" className="btn-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </form>
  );
}

export function EducationManager({ items }: { items: EducationItem[] }) {
  return <Manager items={items} empty="Nenhuma formação cadastrada." addLabel="Adicionar formação"
    url="/api/profile/educations" noun="formação"
    render={(i) => <><p className="font-semibold">{i.course}</p><p className="text-sm text-abyss/70">{i.institution} • {i.startYear} – {i.endYear ?? "em andamento"}</p></>}
    form={(item, done) => <EducationForm item={item} onDone={done} />} />;
}

/* ---------- Experiência ---------- */

export type ExperienceItem = { id: string; company: string; role: string; description: string | null; startDate: string; endDate: string | null };

function ExperienceForm({ item, onDone }: { item?: ExperienceItem; onDone: () => void }) {
  const router = useRouter();
  const [s, setS] = useState<State>({});
  const p = item ? `exp-${item.id}` : "exp-new";
  return (
    <form className="space-y-3 rounded-lg border border-mist bg-foam/50 p-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const f = formData(e);
      // <input type="month"> envia "AAAA-MM"; o servidor converte para data.
      const r = await api(item ? "PATCH" : "POST", item ? `/api/profile/experiences/${item.id}` : "/api/profile/experiences",
        { ...f, startDate: f.startDate ? `${f.startDate}-01` : "", endDate: f.endDate ? `${f.endDate}-01` : "" });
      if (!r.ok) return setS({ error: r.data.fields ? undefined : r.data.error, fields: r.data.fields });
      setS({}); onDone(); router.refresh();
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor={`${p}-role`}>Cargo</label><input id={`${p}-role`} name="role" required defaultValue={item?.role} className="input" /><Msg error={s.fields?.role?.[0]} /></div>
        <div><label className="label" htmlFor={`${p}-company`}>Empresa</label><input id={`${p}-company`} name="company" required defaultValue={item?.company} className="input" /><Msg error={s.fields?.company?.[0]} /></div>
        <div><label className="label" htmlFor={`${p}-start`}>Início</label><input id={`${p}-start`} name="startDate" type="month" required defaultValue={monthValue(item?.startDate ?? null)} className="input" /><Msg error={s.fields?.startDate?.[0]} /></div>
        <div><label className="label" htmlFor={`${p}-end`}>Fim (vazio se atual)</label><input id={`${p}-end`} name="endDate" type="month" defaultValue={monthValue(item?.endDate ?? null)} className="input" /><Msg error={s.fields?.endDate?.[0]} /></div>
      </div>
      <div><label className="label" htmlFor={`${p}-desc`}>O que você fazia</label><textarea id={`${p}-desc`} name="description" rows={3} maxLength={2000} defaultValue={item?.description ?? ""} className="input py-2" /><Msg error={s.fields?.description?.[0]} /></div>
      <Msg error={s.error} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={s.busy}>{s.busy ? "Salvando..." : item ? "Salvar experiência" : "Adicionar experiência"}</button>
        <button type="button" className="btn-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </form>
  );
}

export function ExperienceManager({ items }: { items: ExperienceItem[] }) {
  return <Manager items={items} empty="Nenhuma experiência cadastrada." addLabel="Adicionar experiência"
    url="/api/profile/experiences" noun="experiência"
    render={(i) => <><p className="font-semibold">{i.role}</p><p className="text-sm text-abyss/70">{i.company} • {monthLabel(i.startDate)} – {monthLabel(i.endDate)}</p>
      {i.description && <p className="mt-1 whitespace-pre-line text-sm">{i.description}</p>}</>}
    form={(item, done) => <ExperienceForm item={item} onDone={done} />} />;
}

/* Lista com adicionar, editar e excluir, compartilhada por formação e experiência. */
function Manager<T extends { id: string }>({ items, empty, addLabel, url, noun, render, form }: {
  items: T[]; empty: string; addLabel: string; url: string; noun: string;
  render: (i: T) => React.ReactNode; form: (item: T | undefined, done: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      {items.length === 0 && editing !== "new" && <p className="text-sm text-abyss/70">{empty}</p>}
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.id} className="card">
            {editing === i.id ? form(i, () => setEditing(null)) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 break-words">{render(i)}</div>
                <div className="flex gap-2">
                  <button className="btn-ghost" onClick={() => setEditing(i.id)}>Editar</button>
                  <button className="btn-danger" onClick={async () => {
                    if (!confirm(`Excluir esta ${noun}?`)) return;
                    setError("");
                    const r = await api("DELETE", `${url}/${i.id}`);
                    if (r.ok) router.refresh(); else setError(r.data.error ?? "Não foi possível excluir.");
                  }}>Excluir</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Msg error={error} />
      {editing === "new" ? form(undefined, () => setEditing(null))
        : <button className="btn-ghost" onClick={() => setEditing("new")}>{addLabel}</button>}
    </div>
  );
}

/* ---------- Empresa ---------- */

export function CompanyProfileForm({ initial }: { initial: { name: string; description: string; industry: string; website: string; location: string } }) {
  const router = useRouter();
  const [s, setS] = useState<State>({});
  return (
    <form className="card space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const r = await api("PUT", "/api/company/profile", formData(e));
      if (!r.ok) return setS({ error: r.data.fields ? "Revise os campos destacados." : r.data.error, fields: r.data.fields });
      setS({ ok: "Perfil da empresa salvo." }); router.refresh();
    }}>
      <div><label className="label" htmlFor="c-name">Nome da empresa</label><input id="c-name" name="name" required defaultValue={initial.name} className="input" /><Msg error={s.fields?.name?.[0]} /></div>
      <div><label className="label" htmlFor="c-desc">Descrição</label><textarea id="c-desc" name="description" rows={5} maxLength={4000} defaultValue={initial.description} className="input py-2" /><Msg error={s.fields?.description?.[0]} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-industry">Área de atuação</label><input id="c-industry" name="industry" defaultValue={initial.industry} className="input" placeholder="Tecnologia" /><Msg error={s.fields?.industry?.[0]} /></div>
        <div><label className="label" htmlFor="c-location">Cidade</label><input id="c-location" name="location" defaultValue={initial.location} className="input" /><Msg error={s.fields?.location?.[0]} /></div>
      </div>
      <div><label className="label" htmlFor="c-website">Site</label><input id="c-website" name="website" type="url" defaultValue={initial.website} className="input" placeholder="https://" /><Msg error={s.fields?.website?.[0]} /></div>
      <Msg error={s.error} ok={s.ok} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Salvando..." : "Salvar perfil"}</button>
    </form>
  );
}

/* ---------- Conta ---------- */

export function AccountNameForm({ name }: { name: string }) {
  const router = useRouter();
  const [s, setS] = useState<State>({});
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const r = await api("PATCH", "/api/account", formData(e));
      if (!r.ok) return setS({ error: r.data.fields?.name?.[0] ?? r.data.error });
      setS({ ok: "Nome atualizado." }); router.refresh();
    }}>
      <div><label className="label" htmlFor="acc-name">Nome</label><input id="acc-name" name="name" required defaultValue={name} className="input" /></div>
      <Msg error={s.error} ok={s.ok} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Salvando..." : "Salvar nome"}</button>
    </form>
  );
}

export function PasswordForm() {
  const [s, setS] = useState<State>({});
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const form = e.currentTarget;
      const r = await api("PUT", "/api/account/password", formData(e));
      if (!r.ok) return setS({ error: r.data.fields ? undefined : r.data.error, fields: r.data.fields });
      form.reset(); setS({ ok: "Senha alterada. Entre de novo com a nova senha." });
      // A troca de senha encerra todas as sessões; esta também.
      setTimeout(() => signOut({ redirectTo: "/login?aviso=senha" }), 1500);
    }}>
      <div><label className="label" htmlFor="pw-current">Senha atual</label><input id="pw-current" name="currentPassword" type="password" required autoComplete="current-password" className="input" /><Msg error={s.fields?.currentPassword?.[0]} /></div>
      <div><label className="label" htmlFor="pw-new">Nova senha</label><input id="pw-new" name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
        <p className="mt-1 text-xs text-abyss/60">Mínimo de 8 caracteres, com letras e números.</p><Msg error={s.fields?.newPassword?.[0]} /></div>
      <Msg error={s.error} ok={s.ok} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Alterando..." : "Alterar senha"}</button>
    </form>
  );
}

/* ---------- Imagem ---------- */

const MAX = 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ImageUpload({ userId, version, label }: { userId: string; version: string | null; label: string }) {
  const router = useRouter();
  const [s, setS] = useState<State>({});
  const [fileName, setFileName] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-line bg-foam text-center text-xs leading-tight text-abyss/60">
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image exige o otimizador, que fica sem uso no projeto */}
        {version ? <img src={`/api/images/${userId}?v=${version}`} alt={label} className="h-full w-full object-cover" /> : "Sem imagem"}
      </div>
      <form className="min-w-0 flex-1 space-y-2" onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
        // Checagem rápida no navegador; a validação que vale é a do servidor (bytes do arquivo).
        if (!file) return setS({ error: "Selecione um arquivo." });
        if (!TYPES.includes(file.type)) return setS({ error: "Formato não aceito. Envie PNG, JPEG ou WebP." });
        if (file.size > MAX) return setS({ error: "A imagem deve ter no máximo 1 MB." });
        setS({ busy: true });
        try {
          const res = await fetch("/api/account/image", { method: "POST", body: new FormData(form) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return setS({ error: data.error ?? "Não foi possível enviar." });
          form.reset(); setFileName(""); setS({ ok: "Imagem atualizada." }); router.refresh();
        } catch { setS({ error: "Sem conexão. Tente de novo." }); }
      }}>
        <p className="label" id="img-label">{label}</p>
        <p className="-mt-1 mb-2 text-xs text-abyss/60">PNG, JPEG ou WebP, até 1 MB.</p>
        {/* input nativo escondido; o rótulo faz o papel de botão e mostra o nome escolhido */}
        <div className="flex flex-wrap items-center gap-3">
          <input id="img-file" name="file" type="file" accept="image/png,image/jpeg,image/webp" required className="peer sr-only" aria-labelledby="img-label"
            onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? "")} />
          <label htmlFor="img-file" className="btn-ghost cursor-pointer peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tide">Escolher arquivo</label>
          <span className="min-w-0 truncate text-sm text-abyss/70" aria-live="polite">{fileName || "Nenhum arquivo escolhido"}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={s.busy}>{s.busy ? "Enviando..." : "Enviar imagem"}</button>
          {version && <button type="button" className="btn-danger" onClick={async () => {
            if (!confirm("Remover a imagem?")) return;
            const r = await api("DELETE", "/api/account/image");
            if (r.ok) { setS({ ok: "Imagem removida." }); router.refresh(); } else setS({ error: r.data.error });
          }}>Remover</button>}
        </div>
        <Msg error={s.error} ok={s.ok} />
      </form>
    </div>
  );
}

/* ---------- Notificações ---------- */

export type NotificationItem = { id: string; title: string; body: string; read: boolean; createdAt: string };

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const unread = items.filter((n) => !n.read).length;
  const mark = async (body: object) => {
    setError("");
    const r = await api("PATCH", "/api/notifications", body);
    if (r.ok) router.refresh(); else setError(r.data.error ?? "Não foi possível atualizar.");
  };
  if (items.length === 0) return <p className="text-sm text-abyss/70">Nenhuma notificação ainda.</p>;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-abyss/70" aria-live="polite">{unread === 0 ? "Todas lidas." : `${unread} não ${unread === 1 ? "lida" : "lidas"}.`}</p>
        {unread > 0 && <button className="btn-ghost" onClick={() => mark({ all: true })}>Marcar todas como lidas</button>}
      </div>
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id} className={`card flex flex-wrap items-start justify-between gap-3 text-sm ${n.read ? "" : "border-tide/50 bg-foam/60"}`}>
            <div className="min-w-0 break-words">
              <p className="font-semibold">{!n.read && <span className="sr-only">Não lida: </span>}{n.title}</p>
              <p>{n.body}</p>
              <p className="mt-1 text-xs text-abyss/60">{new Date(n.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
            </div>
            {!n.read && <button className="btn-ghost" onClick={() => mark({ ids: [n.id] })}>Marcar como lida</button>}
          </li>
        ))}
      </ul>
      <Msg error={error} />
    </div>
  );
}

/* ---------- Privacidade (LGPD): exportar e excluir ---------- */

export function DataExport() {
  const [s, setS] = useState<State>({});
  return (
    <div className="rounded-control border border-mist bg-fossa/50 p-4">
      <p className="font-medium">Baixar meus dados</p>
      <p className="mt-1 text-sm text-abyss/65">Um arquivo JSON com sua conta, perfil, candidaturas ou vagas, notificações e pedidos de suporte.</p>
      <button type="button" className="btn-ghost mt-3" disabled={s.busy} onClick={async () => {
        setS({ busy: true });
        const res = await fetch("/api/account/export");
        if (!res.ok) { const d = await res.json().catch(() => ({})); return setS({ error: d.error ?? "Não foi possível gerar o arquivo." }); }
        const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "nautiwork-meus-dados.json";
        const url = URL.createObjectURL(await res.blob());
        const a = Object.assign(document.createElement("a"), { href: url, download: name });
        document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        setS({ ok: "Arquivo baixado." });
      }}>{s.busy ? "Gerando arquivo..." : "Baixar meus dados"}</button>
      <Msg error={s.error} ok={s.ok} />
    </div>
  );
}

export function DeleteAccountForm({ role }: { role: "CANDIDATE" | "COMPANY" | "ADMIN" }) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<State>({});
  if (role === "ADMIN") return (
    <div className="rounded-control border border-mist bg-fossa/50 p-4 text-sm text-abyss/70">
      Contas de administrador não podem ser excluídas por aqui. Peça a outra pessoa da equipe, para que o sistema nunca fique sem administrador.
    </div>
  );
  const what = role === "COMPANY"
    ? "o perfil da empresa, todas as vagas e as candidaturas recebidas. Os candidatos com processo em andamento serão avisados de que as vagas foram encerradas."
    : "seu perfil, foto, candidaturas, vagas salvas, notificações e pedidos de suporte. As empresas deixam de ver suas candidaturas.";
  return (
    <div className="rounded-control border border-coral/40 bg-coral/5 p-4">
      <p className="font-medium text-coral">Excluir conta</p>
      <p className="mt-1 text-sm text-abyss/75">Apaga na hora {what} Não dá para desfazer.</p>
      {!open ? (
        <button type="button" className="btn-danger mt-3" onClick={() => setOpen(true)}>Quero excluir minha conta</button>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={async (e) => {
          e.preventDefault(); setS({ busy: true });
          const r = await api("DELETE", "/api/account", formData(e));
          if (!r.ok) return setS({ error: r.data.fields ? undefined : r.data.error, fields: r.data.fields });
          setS({ ok: "Conta excluída. Saindo..." });
          setTimeout(() => signOut({ redirectTo: "/?aviso=conta-excluida" }), 1200);
        }}>
          <div><label className="label" htmlFor="del-password">Sua senha</label><input id="del-password" name="password" type="password" required autoComplete="current-password" className="input" /><Msg error={s.fields?.password?.[0]} /></div>
          <div><label className="label" htmlFor="del-confirm">Digite EXCLUIR para confirmar</label><input id="del-confirm" name="confirm" required autoComplete="off" className="input" /><Msg error={s.fields?.confirm?.[0]} /></div>
          <Msg error={s.error} ok={s.ok} />
          <div className="flex flex-wrap gap-2">
            <button className="btn-danger" disabled={s.busy || !!s.ok}>{s.busy ? "Excluindo..." : "Excluir conta definitivamente"}</button>
            <button type="button" className="btn-ghost" onClick={() => { setOpen(false); setS({}); }}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
