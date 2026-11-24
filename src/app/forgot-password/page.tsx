import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/email-forms";

export default function Forgot() {
  return (<AuthShell>
    <h1 className="mb-2 text-2xl font-semibold">Recuperar senha</h1>
    <p className="mb-6 text-sm text-abyss/70">Informe o e-mail da conta. Se ele estiver cadastrado, você recebe um link para criar uma nova senha.</p>
    <ForgotPasswordForm />
    <p className="mt-4 text-sm"><Link className="text-tide" href="/login">Voltar para o login</Link></p>
  </AuthShell>);
}
