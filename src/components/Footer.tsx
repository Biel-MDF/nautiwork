import Link from "next/link";
import { Logo } from "./Logo";
export function Footer() {
  return (
    <footer className="mt-auto border-t border-mist/70 pt-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2 text-abyss/80">
          <Link className="hover:text-tide" href="/jobs">Vagas</Link>
          <Link className="hover:text-tide" href="/companies">Empresas</Link>
          <Link className="hover:text-tide" href="/about">Sobre</Link>
          <Link className="hover:text-tide" href="/privacidade">Privacidade</Link>
          <Link className="hover:text-tide" href="/termos">Termos</Link>
        </nav>
        <p className="max-w-xs text-abyss/60">Projeto acadêmico de TCC. Empresas, vagas e pessoas da demonstração são fictícias.</p>
      </div>
    </footer>
  );
}
