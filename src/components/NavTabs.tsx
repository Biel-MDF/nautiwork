"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Abas públicas. Cada uma tem uma descrição curta (aparece como dica e é lida por leitores de tela).
export const tabs = [
  { href: "/", label: "Início", hint: "Radar de empresas contratando, vagas recentes e como funciona" },
  { href: "/jobs", label: "Vagas", hint: "Busque por cargo, cidade, modalidade, contratação e salário" },
  { href: "/companies", label: "Empresas", hint: "Quem está contratando e as vagas abertas de cada empresa" },
  { href: "/about", label: "Sobre", hint: "O projeto e como a compatibilidade é calculada" },
] as const;

export function NavTabs({ variant }: { variant: "desktop" | "mobile" }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <ul className={variant === "desktop" ? "hidden items-center gap-1 sm:flex" : "flex justify-around sm:hidden"}>
      {tabs.map((t) => {
        const on = isActive(t.href);
        return (
          <li key={t.href}>
            <Link href={t.href} title={t.hint} aria-current={on ? "page" : undefined} aria-description={t.hint}
              className={`relative inline-flex min-h-[40px] items-center rounded-control px-3 text-sm font-medium transition-colors
                ${on ? "text-abyss" : "text-abyss/70 hover:bg-casco hover:text-abyss"}
                after:absolute after:inset-x-3 after:-bottom-[7px] after:h-[2px] after:rounded-full ${on ? "after:bg-tide" : "after:bg-transparent"}`}>
              {t.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
