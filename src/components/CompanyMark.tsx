import { monogram } from "@/lib/display";
import { colorOf } from "./UserAvatar";

/**
 * Marca da empresa: o logotipo enviado ou, sem logo, um monograma num quadrado arredondado
 * (empresas são quadradas, pessoas são redondas). A cor é fixa por empresa.
 */
export function CompanyMark({ userId, name, imageVersion, size = 40 }: { userId: string; name: string; imageVersion: number | null; size?: number }) {
  const box = { width: size, height: size, borderRadius: Math.round(size * 0.26) };
  if (imageVersion) {
    // eslint-disable-next-line @next/next/no-img-element -- next/image exige o otimizador, que fica sem uso no projeto
    return <img src={`/api/images/${userId}?v=${imageVersion}`} alt="" style={box} className="shrink-0 bg-white object-contain" />;
  }
  const c = colorOf(userId);
  return (
    <span aria-hidden="true" style={{ ...box, background: `linear-gradient(135deg, ${c}, ${c}B3)`, fontSize: Math.round(size * 0.36) }}
      className="inline-flex shrink-0 select-none items-center justify-center font-display font-bold tracking-tight text-[#030A1A] shadow-[inset_0_-2px_0_rgba(3,10,26,0.18)]">
      {monogram(name)}
    </span>
  );
}
