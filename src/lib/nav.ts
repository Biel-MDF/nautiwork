/** Página "pai" de um endereço, usada pelo botão Voltar quando não há histórico no site. */
export function parentOf(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "/";
  if (parts.length === 2 && parts[1] === "dashboard") return "/";
  parts.pop();
  // pula identificadores: /company/jobs/<id>/edit → /company/jobs
  while (parts.length > 1 && /^c[a-z0-9]{15,}$/.test(parts[parts.length - 1])) parts.pop();
  const p = `/${parts.join("/")}`;
  return /^\/(candidate|company|admin)$/.test(p) ? `${p}/dashboard` : p;
}
