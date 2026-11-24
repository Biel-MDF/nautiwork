// Avatar usado no menu da conta: foto enviada pela pessoa ou, sem foto, a primeira letra
// sobre uma cor fixa derivada do id (a mesma pessoa sempre tem a mesma cor).
const palette = ["#5CB8FF", "#3DE3C3", "#FF9B8A", "#B9A6FF", "#FFCF70", "#8FE3A8"];

export function initialOf(name: string) {
  const clean = name.replace(/\[[^\]]*\]/g, "").trim();
  return (clean.match(/\p{L}/u)?.[0] ?? "?").toUpperCase();
}
export function colorOf(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

export function UserAvatar({ userId, name, imageVersion, size = 36 }: { userId: string; name: string; imageVersion: number | null; size?: number }) {
  const box = { width: size, height: size };
  if (imageVersion) {
    // eslint-disable-next-line @next/next/no-img-element -- next/image exige o otimizador, que fica sem uso no projeto
    return <img src={`/api/images/${userId}?v=${imageVersion}`} alt="" style={box} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <span aria-hidden="true" style={{ ...box, background: colorOf(userId), fontSize: Math.round(size * 0.44) }}
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold text-fossa">
      {initialOf(name)}
    </span>
  );
}
