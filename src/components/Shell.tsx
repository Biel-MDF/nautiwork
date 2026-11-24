import { Navbar } from "./Navbar";
import { ShellNav } from "./ShellNav";

const menus = {
  CANDIDATE: [["Painel", "/candidate/dashboard"], ["Perfil", "/candidate/profile"], ["Currículo", "/candidate/resume"],
    ["Candidaturas", "/candidate/applications"], ["Vagas salvas", "/candidate/saved-jobs"], ["Configurações", "/candidate/settings"]],
  COMPANY: [["Painel", "/company/dashboard"], ["Perfil da empresa", "/company/profile"], ["Vagas", "/company/jobs"],
    ["Nova vaga", "/company/jobs/new"], ["Candidaturas", "/company/applications"], ["Candidatos", "/company/candidates"]],
  ADMIN: [["Painel", "/admin/dashboard"], ["Usuários", "/admin/users"], ["Empresas", "/admin/companies"], ["Vagas", "/admin/jobs"]],
} as const;

export async function Shell({ role, title, children }: { role: keyof typeof menus; title: string; children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[210px_1fr] md:gap-10">
        <ShellNav items={menus[role]} />
        <main className="min-w-0">
          <h1 className="mb-6 text-2xl font-semibold sm:text-[28px]">{title}</h1>
          {children}
        </main>
      </div>
    </>
  );
}
