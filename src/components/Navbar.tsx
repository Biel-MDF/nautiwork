import Link from "next/link";
import { signOut } from "@/lib/auth";
import { currentUser } from "@/lib/rbac";
import { Logo } from "./Logo";

const home = { CANDIDATE: "/candidate/dashboard", COMPANY: "/company/dashboard", ADMIN: "/admin/dashboard" } as const;

export async function Navbar() {
  // Confere no banco: sessão de conta desativada ou com senha trocada não aparece como logada.
  const user = await currentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-mist/70 bg-fossa/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3" aria-label="Principal">
        <Link href="/" aria-label="Nautiwork, página inicial"><Logo compact /></Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-abyss/85 sm:flex">
          <Link href="/jobs" className="hover:text-tide">Vagas</Link>
          <Link href="/companies" className="hover:text-tide">Empresas</Link>
          <Link href="/about" className="hover:text-tide">Sobre</Link>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user ? (
            <>
              <Link href={home[user.role]} className="btn-ghost px-3 sm:px-4">Meu painel</Link>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button className="btn-ghost px-3 sm:px-4" type="submit">Sair</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-3 sm:px-4">Entrar</Link>
              <Link href="/register" className="btn-primary px-3 sm:px-4">Criar conta</Link>
            </>
          )}
        </div>
      </nav>
      <div className="flex justify-center gap-8 border-t border-mist/70 py-2.5 text-sm font-medium text-abyss/85 sm:hidden">
        <Link className="hover:text-tide" href="/jobs">Vagas</Link><Link className="hover:text-tide" href="/companies">Empresas</Link><Link className="hover:text-tide" href="/about">Sobre</Link>
      </div>
    </header>
  );
}
