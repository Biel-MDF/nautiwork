// Partes puras do Markdown do assistente (testáveis sem React).

/** Caminho interno do site (e não "//outro-site"). */
export function internalHref(href: string) {
  return /^\/(?!\/)[\w\-/?=&%.#]*$/.test(href) ? href : null;
}

export type Block = { kind: "p"; text: string } | { kind: "h"; text: string } | { kind: "ul"; items: string[] } | { kind: "ol"; items: string[] };

export function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) { blocks.push({ kind: "p", text: para.join("\n") }); para = []; } };
  for (const raw of src.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*[-*•]\s+(.*)$/), ol = line.match(/^\s*\d+[.)]\s+(.*)$/), h = line.match(/^#{1,4}\s+(.*)$/);
    if (!line.trim()) { flush(); continue; }
    if (h) { flush(); blocks.push({ kind: "h", text: h[1] }); continue; }
    const item = ul?.[1] ?? ol?.[1];
    if (item !== undefined) {
      flush();
      const kind = ul ? "ul" : "ol";
      const prev = blocks.at(-1);
      if (prev && prev.kind === kind) prev.items.push(item); else blocks.push({ kind, items: [item] });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

