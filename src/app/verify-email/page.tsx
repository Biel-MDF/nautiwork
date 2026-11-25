import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { VerifyEmailButton } from "@/components/email-forms";

export const metadata = { title: "Confirmar e-mail — Nautiwork" };

// A confirmação acontece no clique (POST), e não ao abrir a página: alguns provedores de e-mail
// abrem os links das mensagens automaticamente para checar segurança, e isso não deve consumir o token.
export default async function VerifyEmail(props: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await props.searchParams;
  return (
    <AuthShell title="Confirmar e-mail" subtitle="Um clique para confirmar que este e-mail é seu.">
      {token ? <VerifyEmailButton token={token} />
        : <p className="card text-center">Link incompleto. Entre na sua conta e peça um novo link no painel. <Link className="font-semibold text-tide hover:underline" href="/login">Entrar</Link></p>}
    </AuthShell>
  );
}
