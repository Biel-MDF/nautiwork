import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/email-forms";

export default async function ResetPassword(props: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await props.searchParams;
  return (<AuthShell>
    <h1 className="mb-6 text-2xl font-semibold">Criar nova senha</h1>
    {token ? <ResetPasswordForm token={token} /> : <p>Link incompleto. <Link className="text-tide" href="/forgot-password">Peça um novo link</Link>.</p>}
  </AuthShell>);
}
