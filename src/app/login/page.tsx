import { LoginForm } from "@/components/forms";
import { AuthAlternative, AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Entrar — Nautiwork" };

const avisos: Record<string, string> = {
  senha: "Senha alterada. Entre com a nova senha.",
  redefinida: "Senha redefinida. Entre com a nova senha.",
};

export default async function Login(props: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await props.searchParams;
  const msg = aviso ? avisos[aviso] : undefined;
  return (
    <AuthShell title="Entre no Nautiwork" subtitle="Candidatos, empresas e equipe usam o mesmo acesso.">
      {msg && <p role="status" className="-mt-1 mb-4 rounded-control border border-reef/30 bg-reef/10 p-3 text-sm text-reef">{msg}</p>}
      <LoginForm />
      <AuthAlternative href="/register" label="Criar conta grátis" hint="Para quem procura vaga e para empresas que querem publicar." />
    </AuthShell>
  );
}
