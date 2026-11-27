"use client";
// Sino do topo: contador de não lidas (vem de /api/me) e as últimas notificações ao abrir.
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/client";
import { meChanged } from "@/lib/me";

type Item = { id: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

export function NotificationBell({ unread, panel }: { unread: number; panel: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const path = usePathname();

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    void api<{ items: Item[] }>("GET", "/api/notifications").then((r) => { if (r.ok) setItems((r.data as { items: Item[] }).items); });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  const mark = async (body: object) => { const r = await api("PATCH", "/api/notifications", body); if (r.ok) meChanged(); return r.ok; };
  const label = unread > 0 ? `Notificações, ${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Notificações";

  return (
    <div className="relative">
      <button ref={btn} type="button" aria-label={label} aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-control text-abyss/85 hover:bg-casco hover:text-abyss">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z M10 20.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        {unread > 0 && <span aria-hidden="true" className="tabular absolute right-1 top-1 min-w-[18px] rounded-full bg-coral px-1 text-center text-[11px] font-bold leading-[18px] text-fossa">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div ref={box} id={id} className="fixed inset-x-3 top-[68px] z-40 rounded-panel sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[360px] border border-mist bg-casco p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <p className="font-semibold">Notificações</p>
            {unread > 0 && <button type="button" className="tap text-xs font-semibold text-tide hover:underline" onClick={async () => { if (await mark({ all: true })) setItems((xs) => xs?.map((x) => ({ ...x, read: true })) ?? null); }}>Marcar todas como lidas</button>}
          </div>
          {items === null ? <p className="px-2 py-3 text-sm text-abyss/65">Carregando...</p>
            : items.length === 0 ? <p className="px-2 py-3 text-sm text-abyss/65">Nenhuma notificação ainda.</p>
            : <ul className="max-h-[60vh] space-y-1 overflow-y-auto">{items.map((n) => {
                const content = (<>
                  <span className="flex items-start gap-2"><span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-tide"}`} />
                    <span className="min-w-0"><span className="block font-medium">{!n.read && <span className="sr-only">Não lida: </span>}{n.title}</span>
                      <span className="line-clamp-2 block text-abyss/70">{n.body}</span>
                      <span className="mt-0.5 block text-xs text-abyss/55">{new Date(n.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span></span></span>
                </>);
                const cls = `block rounded-control px-2 py-2 text-sm ${n.read ? "" : "bg-foam/50"}`;
                return <li key={n.id}>{n.link
                  ? <Link href={n.link} className={`${cls} hover:bg-foam`} onClick={() => { if (!n.read) void mark({ ids: [n.id] }); setOpen(false); }}>{content}</Link>
                  : <div className={cls}>{content}</div>}</li>;
              })}</ul>}
          <Link href={panel} className="mt-1 block rounded-control px-2 py-2 text-center text-sm font-semibold text-tide hover:bg-foam" onClick={() => setOpen(false)}>Ver todas no painel</Link>
        </div>
      )}
    </div>
  );
}
