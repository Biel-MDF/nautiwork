"use client";
// Markdown mínimo e seguro para as respostas do assistente: parágrafos, listas, negrito,
// código e links. Nada de HTML vindo do modelo; só links internos viram links.
import Link from "next/link";
import type { ReactNode } from "react";
import { internalHref, parseBlocks } from "./markdown-parse";

const INLINE = /\[([^\]\n]{1,200})\]\(([^)\s]{1,300})\)|\*\*([^*\n]{1,300})\*\*|`([^`\n]{1,200})`|(?<![\w/])(\/(?:jobs|companies|candidate|company|support|register|login|about|aparencia|privacidade|termos|forgot-password)(?:[\w\-/?=&%.]*[\w/])?)/g;

function inline(text: string, onNavigate?: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0, k = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [whole, label, href, bold, code, bare] = m;
    if (label !== undefined) {
      const to = internalHref(href);
      out.push(to ? <Link key={k++} href={to} onClick={onNavigate} className="font-semibold text-tide underline decoration-tide/40 underline-offset-2 hover:decoration-tide">{label}</Link> : label);
    } else if (bold !== undefined) out.push(<strong key={k++} className="font-semibold">{bold}</strong>);
    else if (code !== undefined) out.push(<code key={k++} className="rounded bg-foam px-1 py-0.5 text-[0.9em]">{code}</code>);
    else if (bare !== undefined) out.push(<Link key={k++} href={bare} onClick={onNavigate} className="font-semibold text-tide underline decoration-tide/40 underline-offset-2 hover:decoration-tide">{bare}</Link>);
    else out.push(whole);
    last = m.index + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  return (
    <div className="space-y-2 break-words">
      {parseBlocks(text).map((b, i) => {
        if (b.kind === "h") return <p key={i} className="font-display font-semibold">{inline(b.text, onNavigate)}</p>;
        if (b.kind === "p") return <p key={i} className="whitespace-pre-line">{inline(b.text, onNavigate)}</p>;
        const List = b.kind === "ul" ? "ul" : "ol";
        return (
          <List key={i} className={`space-y-1 pl-5 ${b.kind === "ul" ? "list-disc" : "list-decimal"} marker:text-abyss/60`}>
            {b.items.map((it, j) => <li key={j}>{inline(it, onNavigate)}</li>)}
          </List>
        );
      })}
    </div>
  );
}
