import Link from "next/link";
import { LoginForm } from "@/components/forms";
import { AuthShell } from "@/components/AuthShell";

const avisos: Record<string, string> = {
  senha: "Senha alterada. Entre com a nova senha.",
  redefinida: "Senha redefinida. Entre com a nova senha.",
};

export default async function Login(props: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await props.searchParams;
  const msg = aviso ? avisos[aviso] : undefined;
  return (<AuthShell>
    <h1 className="mb-6 text-2xl font-semibold">Entrar</h1>
    {msg && <p role="status" className="mb-4 rounded-control border border-reef/30 bg-reef/10 p-3 text-sm text-reef">{msg}</p>}
    <LoginForm />
    <div className="mt-6 flex items-center justify-between gap-3 text-sm"><Link className="text-tide hover:underline" href="/forgot-password">Esqueci minha senha</Link><Link className="font-semibold text-tide hover:underline" href="/register">Criar conta</Link></div>
  </AuthShell>);
}
