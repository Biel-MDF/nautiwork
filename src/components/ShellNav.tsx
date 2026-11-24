"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Menu da área logada. Marca a página atual (aria-current) com um traço de sonar à esquerda. */
export function ShellNav({ items }: { items: readonly (readonly [string, string])[] }) {
  const path = usePathname();
  const active = items.reduce<string | null>((best, [, href]) =>
    (path === href || path.startsWith(href + "/")) && (!best || href.length > best.length) ? href : best, null);
  return (
    <nav aria-label="Área logada" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0">
      {items.map(([label, href]) => {
        const on = href === active;
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined}
            className={`relative flex min-h-[44px] shrink-0 items-center rounded-control px-3.5 text-sm font-medium transition-colors md:w-full
              ${on ? "bg-foam text-abyss md:before:absolute md:before:inset-y-2.5 md:before:left-0 md:before:w-[3px] md:before:rounded-full md:before:bg-tide border border-tide/40 md:border-transparent"
                   : "border border-mist text-abyss/75 hover:bg-casco hover:text-abyss md:border-transparent"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
