"use client";
import Link from "next/link";
import { useEffect } from "react";
import { clearMe, useMe } from "@/lib/me";
import { signOutAction } from "@/app/actions/auth";
import { AccountMenu } from "./AccountMenu";
import { MobileMenu } from "./MobileMenu";
import { ViewModeBar } from "./ViewMode";

const home = { CANDIDATE: "/candidate/dashboard", COMPANY: "/company/dashboard", ADMIN: "/admin/dashboard" } as const;

/** Lado direito do menu: entrar/criar conta ou o menu da conta. Enquanto não sabe, guarda o espaço. */
export function NavAccount() {
  const me = useMe();
  const user = me?.user;
  if (me === undefined) return (<><span aria-hidden="true" className="hidden h-11 w-[104px] sm:block" /><span aria-hidden="true" className="h-[34px] w-[34px]" /><MobileMenu loggedIn={false} /></>);
  return (
    <>
      {user ? (
        <>
          <Link href={home[user.role]} className="btn-ghost hidden px-4 sm:inline-flex">Meu painel</Link>
          <AccountMenu signOutAction={async () => { clearMe(); await signOutAction(); }} user={user} />
        </>
      ) : (
        <>
          <Link href="/login" className="btn-ghost hidden px-4 sm:inline-flex">Entrar</Link>
          <Link href="/register" className="btn-primary px-3 sm:px-4">Criar conta</Link>
        </>
      )}
      <MobileMenu loggedIn={!!user} />
    </>
  );
}

/** Barra do modo de visualização do admin (vinha do layout raiz, que agora não lê a sessão). */
export function ViewModeGate() {
  const me = useMe();
  const mode = me?.mode ?? null;
  useEffect(() => { document.body.classList.toggle("pb-28", !!mode); }, [mode]);
  return mode ? <ViewModeBar mode={mode} as={me?.as ?? null} /> : null;
}
