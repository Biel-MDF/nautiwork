// Ajudantes de exibição usados em várias telas públicas.

/** Separa o prefixo "[Demo]" do nome: a tela mostra o nome limpo e um selo discreto. */
export function splitDemo(name: string) {
  const demo = /^\s*\[demo\]\s*/i.test(name);
  return { name: name.replace(/\[[^\]]*\]\s*/g, "").trim(), demo };
}

/** "hoje", "ontem", "há 3 dias", "há 2 semanas", "há 1 mês". */
export function timeAgo(date: Date | string, now = new Date()) {
  const d = typeof date === "string" ? new Date(date) : date;
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 30) { const w = Math.floor(days / 7); return `há ${w} ${w === 1 ? "semana" : "semanas"}`; }
  const m = Math.floor(days / 30);
  return m < 12 ? `há ${m} ${m === 1 ? "mês" : "meses"}` : "há mais de um ano";
}

/** Iniciais das duas primeiras palavras relevantes ("Âncora Logística" → "ÂL"). */
export function monogram(name: string) {
  const words = splitDemo(name).name.split(/\s+/).filter((w) => /^\p{L}/u.test(w) && !/^(de|da|do|das|dos|e)$/i.test(w));
  return ((words[0]?.[0] ?? "?") + (words[1]?.[0] ?? "")).toUpperCase();
}
