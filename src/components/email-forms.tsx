"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Msg } from "./forms";

export function ForgotPasswordForm() {
  const [s, setS] = useState<{ busy?: boolean; ok?: string; error?: string }>({});
  if (s.ok) return <p role="status" className="rounded-lg bg-reef/10 p-3 text-sm text-reef">{s.ok}</p>;
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setS({ busy: true });
      const email = String(new FormData(e.currentTarget).get("email") ?? "");
      const r = await api<{ message: string }>("POST", "/api/password/forgot", { email });
      setS(r.ok ? { ok: r.data.message } : { error: r.data.fields?.email?.[0] ?? r.data.error });
    }}>
      <div><label className="label" htmlFor="fp-email">E-mail</label><input id="fp-email" name="email" type="email" required autoComplete="email" className="input" /></div>
      <Msg error={s.error} />
      <button className="btn-primary w-full" disabled={s.busy}>{s.busy ? "Enviando..." : "Enviar link"}</button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [s, setS] = useState<{ busy?: boolean; error?: string; field?: string }>({});
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const newPassword = String(f.get("newPassword") ?? "");
      if (newPassword !== f.get("confirm")) return setS({ field: "As senhas não conferem." });
      setS({ busy: true });
      const r = await api("POST", "/api/password/reset", { token, newPassword });
      if (r.ok) return router.push("/login?aviso=redefinida");
      setS({ error: r.data.fields?.newPassword ? undefined : r.data.error, field: r.data.fields?.newPassword?.[0] });
    }}>
      <div><label className="label" htmlFor="rp-new">Nova senha</label><input id="rp-new" name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
        <p className="mt-1 text-xs text-abyss/60">Mínimo de 8 caracteres, com letras e números.</p></div>
      <div><label className="label" htmlFor="rp-confirm">Repita a nova senha</label><input id="rp-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" /><Msg error={s.field} /></div>
      <Msg error={s.error} />
      {s.error && <p className="text-sm"><Link className="text-tide" href="/forgot-password">Pedir um novo link</Link></p>}
      <button className="btn-primary w-full" disabled={s.busy}>{s.busy ? "Salvando..." : "Salvar nova senha"}</button>
    </form>
  );
}

export function VerifyEmailButton({ token }: { token: string }) {
  const [s, setS] = useState<{ busy?: boolean; ok?: boolean; error?: string }>({});
  if (s.ok) return <p role="status" className="rounded-lg bg-reef/10 p-3 text-sm text-reef">E-mail confirmado. <Link className="font-semibold underline" href="/">Continuar</Link></p>;
  return (
    <div className="space-y-3">
      <p className="text-sm">Clique no botão para confirmar que este e-mail é seu.</p>
      <button className="btn-primary w-full" disabled={s.busy} onClick={async () => {
        setS({ busy: true });
        const r = await api("POST", "/api/email/verify", { token });
        setS(r.ok ? { ok: true } : { error: r.data.error ?? "Não foi possível confirmar." });
      }}>{s.busy ? "Confirmando..." : "Confirmar e-mail"}</button>
      <Msg error={s.error} />
    </div>
  );
}

/** Aviso no painel para quem ainda não confirmou o e-mail, com reenvio do link. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [s, setS] = useState<{ busy?: boolean; ok?: string; error?: string }>({});
  return (
    <div className="mb-6 rounded-lg border border-tide/30 bg-foam p-4 text-sm" role="region" aria-label="Confirmação de e-mail">
      <p><span className="font-semibold">Confirme seu e-mail.</span> Enviamos um link para <span className="break-all">{email}</span>.</p>
      {s.ok ? <p role="status" className="mt-2 text-reef">{s.ok}</p> : (
        <button className="btn-ghost mt-3" disabled={s.busy} onClick={async () => {
          setS({ busy: true });
          const r = await api<{ message: string }>("POST", "/api/email/resend");
          setS(r.ok ? { ok: r.data.message } : { error: r.data.error });
        }}>{s.busy ? "Enviando..." : "Reenviar link"}</button>)}
      <Msg error={s.error} />
    </div>
  );
}
