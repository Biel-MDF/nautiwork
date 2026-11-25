"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tabs } from "./NavTabs";

/** No celular, as abas ficam num menu: uma barra só no topo em vez de duas. */
export function MobileMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (!panel.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <div className="sm:hidden">
      <button ref={btn} type="button" aria-expanded={open} aria-controls={id} aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)} className="flex h-11 w-11 items-center justify-center rounded-control text-abyss hover:bg-casco">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </svg>
      </button>
      {open && (
        <div ref={panel} id={id} className="absolute inset-x-0 top-full border-b border-mist/70 bg-fossa px-4 pb-4 pt-2 shadow-[0_24px_48px_rgb(0_0_0/var(--shade-a))] motion-safe:animate-menu">
          <ul className="divide-y divide-mist/60">
            {tabs.map((t) => (
              <li key={t.href}>
                <Link href={t.href} prefetch aria-current={isActive(t.href) ? "page" : undefined}
                  className={`flex min-h-[56px] flex-col justify-center py-2 ${isActive(t.href) ? "text-abyss" : "text-abyss/80"}`}>
                  <span className="flex items-center gap-2 font-medium">{isActive(t.href) && <span className="h-1.5 w-1.5 rounded-full bg-tide" aria-hidden="true" />}{t.label}</span>
                  <span className="text-xs text-abyss/60">{t.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
          {!loggedIn && <Link href="/login" className="btn-ghost mt-3 w-full">Entrar</Link>}
        </div>
      )}
    </div>
  );
}
