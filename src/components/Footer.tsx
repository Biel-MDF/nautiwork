import Link from "next/link";
import { Logo } from "./Logo";

const cols: [string, [string, string][]][] = [
  ["Plataforma", [["Vagas", "/jobs"], ["Empresas", "/companies"], ["Sobre o projeto", "/about"]]],
  ["Para empresas", [["Publicar vaga", "/register?tipo=empresa"], ["Entrar como empresa", "/login"]]],
  ["Ajuda", [["Suporte", "/support"], ["Política de Privacidade", "/privacidade"], ["Termos de Uso", "/termos"]]],
];

export function Footer() {
  const contact = process.env.SUPPORT_EMAIL || "ga14012009@gmail.com";
  return (
    <footer className="mt-auto border-t border-mist/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-abyss/70">Plataforma de empregabilidade que mostra o quanto cada vaga combina com o seu perfil.</p>
          <a href={`mailto:${contact}`} className="mt-4 inline-block text-sm font-medium text-tide hover:text-deep hover:underline">{contact}</a>
        </div>
        {cols.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <h2 className="text-sm font-semibold text-abyss">{title}</h2>
            <ul className="mt-3 space-y-1">
              {links.map(([label, href]) => <li key={href}><Link href={href} className="inline-flex min-h-[36px] items-center text-sm text-abyss/70 hover:text-tide">{label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-mist/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-abyss/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TCC NautiWork, Técnico em Desenvolvimento de Sistemas.</p>
          <p>Empresas e vagas com o selo Demo são fictícias. <a href="https://github.com/Biel-MDF/nautiwork" className="underline underline-offset-2 hover:text-tide">Código no GitHub</a></p>
        </div>
      </div>
    </footer>
  );
}
