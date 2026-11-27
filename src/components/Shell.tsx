import { Navbar } from "./Navbar";
import { ShellNav } from "./ShellNav";

export const menus = {
  CANDIDATE: [["Painel", "/candidate/dashboard"], ["Perfil", "/candidate/profile"], ["Currículo", "/candidate/resume"], ["Provas de habilidade", "/candidate/provas"],
    ["Candidaturas", "/candidate/applications"], ["Quem viu meu currículo", "/candidate/views"], ["Vagas salvas", "/candidate/saved-jobs"], ["Configurações", "/candidate/settings"], ["Suporte", "/support"]],
  COMPANY: [["Painel", "/company/dashboard"], ["Perfil da empresa", "/company/profile"], ["Vagas", "/company/jobs"],
    ["Nova vaga", "/company/jobs/new"], ["Candidaturas", "/company/applications"], ["Candidatos", "/company/candidates"], ["Cotas e CNPJ", "/company/cotas"], ["Suporte", "/support"]],
  ADMIN: [["Painel", "/admin/dashboard"], ["Usuários", "/admin/users"], ["Empresas", "/admin/companies"], ["Vagas", "/admin/jobs"], ["Suporte", "/admin/support"]],
} as const;

/**
 * Moldura das áreas logadas, usada pelos layouts de /candidate, /company, /admin e /support.
 * Fica montada entre as páginas da área: só o conteúdo troca ao navegar.
 */
export function AreaFrame({ role, children }: { role: keyof typeof menus; children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:grid-cols-[210px_1fr] md:gap-10">
        <ShellNav items={menus[role]} />
        <main className="min-w-0">{children}</main>
      </div>
    </>
  );
}

/** Conteúdo de uma página da área: título e corpo. A moldura vem do layout. */
export function Shell({ title, children }: { role?: keyof typeof menus; title: string; children: React.ReactNode }) {
  return (
    <>
      {title && <h1 className="mb-6 text-2xl font-semibold sm:text-[28px]">{title}</h1>}
      {children}
    </>
  );
}
