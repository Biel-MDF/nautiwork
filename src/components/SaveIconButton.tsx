"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

const Bookmark = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

/** Marcador de "salvar vaga" no cartão. Sem login, leva ao login e volta. */
export function SaveIconButton({ jobId, state, title }: { jobId: string; state: "saved" | "unsaved" | "login"; title: string }) {
  const router = useRouter();
  const [on, setOn] = useState(state === "saved");
  const [busy, setBusy] = useState(false);
  const cls = "flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-foam";
  if (state === "login") {
    return <Link href="/login" className={`${cls} text-abyss/60 hover:text-tide`} aria-label={`Entre para salvar a vaga ${title}`} title="Entre para salvar"><Bookmark filled={false} /></Link>;
  }
  return (
    <button type="button" aria-pressed={on} disabled={busy} aria-label={on ? `Remover ${title} das vagas salvas` : `Salvar a vaga ${title}`}
      title={on ? "Salva" : "Salvar vaga"} className={`${cls} ${on ? "text-reef" : "text-abyss/60 hover:text-tide"}`}
      onClick={async () => {
        setBusy(true); setOn(!on);
        const r = await api<{ saved: boolean }>("POST", "/api/saved-jobs", { jobId });
        setBusy(false);
        if (r.ok) { setOn(r.data.saved); router.refresh(); } else setOn(on);
      }}>
      <Bookmark filled={on} />
    </button>
  );
}
