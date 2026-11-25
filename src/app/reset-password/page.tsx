import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/email-forms";

export const metadata = { title: "Criar nova senha — Nautiwork" };

export default async function ResetPassword(props: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await props.searchParams;
  return (
    <AuthShell title="Criar nova senha" subtitle="Escolha uma senha com pelo menos 8 caracteres, letras e números."
      notice={<>Depois de salvar, as sessões abertas em outros aparelhos são encerradas.</>}>
      {token ? <ResetPasswordForm token={token} />
        : <p className="card text-center">Link incompleto. <Link className="font-semibold text-tide hover:underline" href="/forgot-password">Peça um novo link</Link>.</p>}
    </AuthShell>
  );
}
