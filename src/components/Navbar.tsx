import Link from "next/link";
import { signOut } from "@/lib/auth";
import { currentUser } from "@/lib/rbac";
import { Logo } from "./Logo";
import { NavTabs } from "./NavTabs";
import { AccountMenu } from "./AccountMenu";

const home = { CANDIDATE: "/candidate/dashboard", COMPANY: "/company/dashboard", ADMIN: "/admin/dashboard" } as const;

export async function Navbar() {
  // Confere no banco: sessão de conta desativada ou com senha trocada não aparece como logada.
  const user = await currentUser();
  async function signOutAction() { "use server"; await signOut({ redirectTo: "/" }); }
  return (
    <header className="sticky top-0 z-30 border-b border-mist/70 bg-fossa/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3" aria-label="Principal">
        <Link href="/" aria-label="Nautiwork, página inicial"><Logo compact /></Link>
        <NavTabs variant="desktop" />
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user ? (
            <>
              <Link href={home[user.role]} className="btn-ghost hidden px-4 sm:inline-flex">Meu painel</Link>
              <AccountMenu signOutAction={signOutAction} user={{
                id: user.id, name: user.name, email: user.email, role: user.role,
                imageVersion: user.image ? user.image.updatedAt.getTime() : null, emailNotifications: user.emailNotifications,
              }} />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-3 sm:px-4">Entrar</Link>
              <Link href="/register" className="btn-primary px-3 sm:px-4">Criar conta</Link>
            </>
          )}
        </div>
      </nav>
      <div className="border-t border-mist/70 py-1.5 sm:hidden"><NavTabs variant="mobile" /></div>
    </header>
  );
}
