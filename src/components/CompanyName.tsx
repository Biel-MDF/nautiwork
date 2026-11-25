import { splitDemo } from "@/lib/display";

/** Nome sem o prefixo [Demo] (empresa ou, com person, pessoa); contas fictícias ganham um selo pequeno ao lado. */
export function CompanyName({ name, className = "", person = false }: { name: string; className?: string; person?: boolean }) {
  const { name: clean, demo } = splitDemo(name);
  return (
    <span className={className}>
      {clean}
      {demo && <span className="ml-1.5 inline-block whitespace-nowrap translate-y-[-1px] rounded-full border border-mist px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-abyss/55" title={person ? "Conta fictícia da demonstração" : "Empresa fictícia da demonstração"}>Demo</span>}
    </span>
  );
}
