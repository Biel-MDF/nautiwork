"use client";
import { Crown, EmperorBadge } from "./Crown";
import { AppearancePanel } from "./ThemePicker";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { ViewAsMenuItems } from "./ViewMode";
import { AccountNameForm, DataExport, DeleteAccountForm, ImageUpload, PasswordForm } from "./account-forms";
import { Msg } from "./forms";
import { UserAvatar } from "./UserAvatar";

type Role = "CANDIDATE" | "COMPANY" | "ADMIN";
export type MenuUser = { id: string; name: string; email: string; role: Role; emperor?: boolean; imageVersion: number | null; emailNotifications: boolean };

const roleLabel: Record<Role, string> = { CANDIDATE: "Candidato", COMPANY: "Empresa", ADMIN: "Administrador" };
const home: Record<Role, string> = { CANDIDATE: "/candidate/dashboard", COMPANY: "/company/dashboard", ADMIN: "/admin/dashboard" };
const profileHref: Record<Role, string | null> = { CANDIDATE: "/candidate/profile", COMPANY: "/company/profile", ADMIN: null };
const plain = (n: string) => n.replace(/\[[^\]]*\]\s*/g, "");

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-tide/90">
    <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const icons = {
  painel: "M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z",
  perfil: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  config: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  suporte: "M4 13a8 8 0 1 1 16 0v4a2 2 0 0 1-2 2h-1v-6h3M4 13v4a2 2 0 0 0 2 2h1v-6H4",
  sair: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10",
};

export function AccountMenu({ user, signOutAction }: { user: MenuUser; signOutAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const items = () => [...(wrap.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    items()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      const list = items();
      const i = list.indexOf(document.activeElement as HTMLElement);
      if (e.key === "Escape") { setOpen(false); button.current?.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
      else if (e.key === "Home") { e.preventDefault(); list[0]?.focus(); }
      else if (e.key === "End") { e.preventDefault(); list[list.length - 1]?.focus(); }
      else if (e.key === "Tab") setOpen(false);
    };
    const onClick = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  const openSettings = (tab: SettingsTab) => { setOpen(false); setSettingsTab(tab); };
  const item = "flex min-h-[44px] w-full items-center gap-3 rounded-control px-3 text-left text-sm text-abyss/90 outline-none hover:bg-foam focus-visible:bg-foam focus-visible:outline-none";
  const profile = profileHref[user.role];

  return (
    <div className="relative" ref={wrap}>
      <button ref={button} type="button" onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} aria-label={`Conta de ${plain(user.name)}`}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${user.emperor ? "imp-ring" : open ? "border-tide" : "border-mist hover:border-tide/60"}`}>
        <UserAvatar userId={user.id} name={user.name} imageVersion={user.imageVersion} size={34} />
        {user.emperor && <span className="imp-text absolute -top-2.5 left-1/2 -translate-x-1/2 drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]"><Crown size={16} /></span>}
      </button>

      {open && (
        <div id={menuId} role="menu" aria-label="Menu da conta"
          className="absolute right-0 top-[calc(100%+10px)] z-40 w-[min(300px,calc(100vw-2rem))] origin-top-right rounded-panel border border-mist bg-casco p-2 shadow-[0_24px_60px_-12px_rgb(0_0_0/var(--shade-a))] motion-safe:animate-menu">
          <div className={`flex items-center gap-3 px-3 pb-3 pt-2 ${user.emperor ? "imp-card -mx-0 rounded-control border" : ""}`}>
            <span className={`shrink-0 rounded-full ${user.emperor ? "imp-ring" : ""}`}><UserAvatar userId={user.id} name={user.name} imageVersion={user.imageVersion} size={44} /></span>
            <div className="min-w-0">
              <p className="truncate font-display font-semibold">{plain(user.name)}</p>
              <p className="truncate text-xs text-abyss/65">{user.email}</p>
              {user.emperor ? <p className="mt-1 flex flex-wrap items-center gap-1.5"><EmperorBadge /><span className="text-xs text-abyss/65">Administrador maior</span></p>
                : <p className="mt-0.5 text-xs text-tide">{roleLabel[user.role]}</p>}
            </div>
          </div>
          <div className="my-1 h-px bg-mist" />
          <Link role="menuitem" href={home[user.role]} className={item} onClick={() => setOpen(false)}><Icon d={icons.painel} />Meu painel</Link>
          {/* Perfil = o que os outros veem (currículo ou página da empresa). Admin não tem perfil público. */}
          {profile && (
            <Link role="menuitem" href={profile} className={`${item} py-2`} onClick={() => setOpen(false)}>
              <Icon d={icons.perfil} />
              <span><span className="block">Configurações de perfil</span><span className="block text-xs text-abyss/60">{user.role === "COMPANY" ? "O que os candidatos veem da empresa" : "O que as empresas veem de você"}</span></span>
            </Link>
          )}
          <button role="menuitem" type="button" className={`${item} py-2`} onClick={() => openSettings("conta")}>
            <Icon d={icons.config} />
            <span><span className="block">Configurações</span><span className="block text-xs text-abyss/60">Conta, foto, senha, avisos, aparência e privacidade</span></span>
          </button>
          {user.role === "ADMIN" && (
            <div className="my-1 border-y border-mist/70 py-1" role="group" aria-label="Ver o site como">
              <p className="px-3 pb-1 pt-1.5 text-xs text-abyss/60">Ver o site como</p>
              <ViewAsMenuItems />
            </div>
          )}
          <Link role="menuitem" href={user.role === "ADMIN" ? "/admin/support" : "/support"} className={item} onClick={() => setOpen(false)}><Icon d={icons.suporte} />Suporte</Link>
          <div className="my-1 h-px bg-mist" />
          <form action={signOutAction}>
            <button role="menuitem" type="submit" className={`${item} text-coral`}><Icon d={icons.sair} />Sair</button>
          </form>
        </div>
      )}

      {settingsTab && <SettingsDialog user={user} initialTab={settingsTab} onClose={() => { setSettingsTab(null); button.current?.focus(); }} />}
    </div>
  );
}

/* ---------- Janela de Configurações ---------- */

type SettingsTab = "conta" | "foto" | "seguranca" | "notificacoes" | "aparencia" | "privacidade";
const settingsTabs: { id: SettingsTab; label: string; hint: string }[] = [
  { id: "conta", label: "Conta", hint: "Nome e e-mail de acesso" },
  { id: "foto", label: "Foto", hint: "Imagem que aparece no menu e para empresas" },
  { id: "seguranca", label: "Segurança", hint: "Troca de senha" },
  { id: "notificacoes", label: "Notificações", hint: "Avisos por e-mail" },
  { id: "aparencia", label: "Aparência", hint: "Tema, cores e modo claro ou escuro" },
  { id: "privacidade", label: "Privacidade", hint: "Seus dados e exclusão da conta" },
];

function SettingsDialog({ user, initialTab, onClose }: { user: MenuUser; initialTab: SettingsTab; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    d.showModal(); // modal nativo: prende o foco, fecha com Esc e deixa o resto da página inerte
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onCancel = (e: Event) => { e.preventDefault(); onClose(); };
    d.addEventListener("cancel", onCancel);
    return () => { d.removeEventListener("cancel", onCancel); document.body.style.overflow = prev; };
  }, [onClose]);

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = settingsTabs.findIndex((t) => t.id === tab);
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!next) return;
    e.preventDefault();
    const t = settingsTabs[(i + next + settingsTabs.length) % settingsTabs.length];
    setTab(t.id);
    document.getElementById(`tab-${t.id}`)?.focus();
  };

  return (
    <dialog ref={ref} aria-labelledby={titleId}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-abyss backdrop:bg-[rgb(var(--scrim)/var(--scrim-a))] backdrop:backdrop-blur-sm sm:m-auto sm:h-[min(540px,calc(100vh-4rem))] sm:w-[min(760px,calc(100vw-2rem))]">
      <div className="flex h-full flex-col overflow-hidden border-mist bg-casco sm:rounded-panel sm:border sm:shadow-[0_40px_100px_-20px_rgb(0_0_0/var(--shade-a))]">
        <header className="flex items-center justify-between gap-4 border-b border-mist px-5 py-4 sm:px-7">
          <div>
            <h2 id={titleId} className="text-xl font-semibold">Configurações</h2>
            <p className="text-sm text-abyss/65">Cada seção tem o seu botão de salvar.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar configurações" className="flex h-11 w-11 items-center justify-center rounded-full text-abyss/75 hover:bg-foam hover:text-abyss">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <div role="tablist" aria-orientation="vertical" aria-label="Seções" onKeyDown={onTabKey}
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-mist px-3 py-2 sm:w-52 sm:flex-col sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
            {settingsTabs.map((t) => (
              <button key={t.id} id={`tab-${t.id}`} role="tab" type="button" aria-selected={tab === t.id} aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1} onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-control px-3 py-2.5 text-left text-sm transition-colors ${tab === t.id ? "bg-foam text-abyss shadow-[inset_2px_0_0_rgb(var(--c-tide))]" : "text-abyss/70 hover:bg-foam/60 hover:text-abyss"}`}>
                <span className="block font-medium">{t.label}</span>
                <span className="hidden text-xs text-abyss/60 sm:block">{t.hint}</span>
              </button>
            ))}
          </div>
          <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {tab === "conta" && (
              <section className="space-y-6">
                <div><h3 className="text-lg font-semibold">Conta</h3><p className="mt-1 text-sm text-abyss/65">É o nome que as empresas e a equipe veem.</p></div>
                <AccountNameForm name={user.name} />
                <div className="rounded-control border border-mist bg-fossa/50 p-4 text-sm">
                  <p className="text-abyss/65">E-mail de acesso</p>
                  <p className="mt-0.5 font-medium">{user.email}</p>
                  <p className="mt-2 text-xs text-abyss/60">Para trocar o e-mail, abra um pedido em <Link href="/support/new" className="text-tide hover:underline" onClick={onClose}>Suporte</Link>.</p>
                </div>
              </section>
            )}
            {tab === "foto" && (
              <section className="space-y-5">
                <div><h3 className="text-lg font-semibold">Foto</h3><p className="mt-1 text-sm text-abyss/65">Sem foto, o menu mostra a primeira letra do seu nome.</p></div>
                <ImageUpload userId={user.id} version={user.imageVersion ? String(user.imageVersion) : null} label={user.role === "COMPANY" ? "Logotipo" : "Foto de perfil"} />
              </section>
            )}
            {tab === "seguranca" && (
              <section className="space-y-5">
                <div><h3 className="text-lg font-semibold">Segurança</h3><p className="mt-1 text-sm text-abyss/65">Ao trocar a senha, todas as sessões abertas são encerradas, inclusive esta.</p></div>
                <PasswordForm />
              </section>
            )}
            {tab === "notificacoes" && (
              <section className="space-y-5">
                <div><h3 className="text-lg font-semibold">Notificações</h3><p className="mt-1 text-sm text-abyss/65">Os avisos sempre aparecem no seu painel. Aqui você escolhe se também quer recebê-los por e-mail.</p></div>
                <PreferencesForm initial={user.emailNotifications} role={user.role} />
              </section>
            )}
            {tab === "aparencia" && (
              <section className="space-y-5" aria-label="Aparência">
                <div><h3 className="text-lg font-semibold">Aparência</h3><p className="mt-1 text-sm text-abyss/65">Escolha a paleta de cores e se o site fica claro, escuro ou igual ao seu aparelho.</p></div>
                <AppearancePanel onNavigate={onClose} />
              </section>
            )}
            {tab === "privacidade" && (
              <section className="space-y-5">
                <div><h3 className="text-lg font-semibold">Privacidade</h3><p className="mt-1 text-sm text-abyss/65">Seus direitos pela LGPD, sem precisar pedir a ninguém. Detalhes na <Link href="/privacidade" className="text-tide hover:underline" onClick={onClose}>Política de Privacidade</Link>.</p></div>
                <DataExport />
                <DeleteAccountForm role={user.role} />
              </section>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

function PreferencesForm({ initial, role }: { initial: boolean; role: Role }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [s, setS] = useState<{ busy?: boolean; ok?: string; error?: string }>({});
  const examples = role === "COMPANY" ? "novas candidaturas e respostas do suporte" : role === "ADMIN" ? "respostas em pedidos de suporte" : "mudanças de etapa nas candidaturas, vagas encerradas e respostas do suporte";
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const r = await api("PATCH", "/api/account/preferences", { emailNotifications: on });
      if (!r.ok) return setS({ error: r.data.error ?? "Não foi possível salvar." });
      setS({ ok: "Preferência salva." }); router.refresh();
    }}>
      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-control border border-mist bg-fossa/50 p-4">
        <span><span className="block font-medium">Receber notificações por e-mail</span><span className="mt-1 block text-sm text-abyss/65">Inclui {examples}.</span></span>
        <span className="relative mt-0.5 inline-flex shrink-0">
          <input type="checkbox" role="switch" checked={on} onChange={(e) => { setOn(e.target.checked); setS({}); }} className="peer sr-only" />
          <span aria-hidden="true" className="h-7 w-12 rounded-full border border-line bg-fossa transition-colors peer-checked:border-tide peer-checked:bg-tide peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tide" />
          <span aria-hidden="true" className="absolute left-1 top-1 h-5 w-5 rounded-full bg-abyss transition-transform peer-checked:translate-x-5 peer-checked:bg-fossa" />
        </span>
      </label>
      <Msg error={s.error} ok={s.ok} />
      <button className="btn-primary" disabled={s.busy}>{s.busy ? "Salvando..." : "Salvar preferências"}</button>
    </form>
  );
}
