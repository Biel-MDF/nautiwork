import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { VerifyEmailButton } from "@/components/email-forms";

// A confirmação acontece no clique (POST), e não ao abrir a página: alguns provedores de e-mail
// abrem os links das mensagens automaticamente para checar segurança, e isso não deve consumir o token.
export default async function VerifyEmail(props: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await props.searchParams;
  return (<AuthShell>
    <h1 className="mb-6 text-2xl font-semibold">Confirmar e-mail</h1>
    {token ? <VerifyEmailButton token={token} /> : <p>Link incompleto. Entre na sua conta e peça um novo link no painel. <Link className="text-tide" href="/login">Entrar</Link></p>}
  </AuthShell>);
}
