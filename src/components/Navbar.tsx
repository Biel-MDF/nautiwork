import Link from "next/link";
import { Logo } from "./Logo";
import { NavTabs } from "./NavTabs";
import { ThemeButton } from "./ThemePicker";
import { BackButton } from "./BackButton";
import { NavAccount } from "./NavAccount";

// Sem leitura de sessão aqui: a conta é carregada no navegador (NavAccount). Isso deixa as
// páginas públicas sem dados pessoais prontas de antemão, servidas pela CDN perto de quem acessa.
export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-mist/70 bg-fossa/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3" aria-label="Principal">
        <div className="flex min-w-0 items-center gap-2">
          <BackButton />
          <Link href="/" aria-label="Nautiwork, página inicial"><Logo compact /></Link>
        </div>
        <NavTabs variant="desktop" />
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeButton />
          <NavAccount />
        </div>
      </nav>
    </header>
  );
}
