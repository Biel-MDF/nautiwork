import { AreaFrame } from "@/components/Shell";
import { currentUser } from "@/lib/rbac";

// O suporte serve candidatos e empresas: a barra lateral segue o papel de quem está logado.
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return <AreaFrame role={user?.role ?? "CANDIDATE"}>{children}</AreaFrame>;
}
