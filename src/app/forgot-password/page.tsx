import { AuthAlternative, AuthShell } from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/email-forms";

export const metadata = { title: "Recuperar senha — Nautiwork" };

export default function Forgot() {
  return (
    <AuthShell title="Recuperar senha" subtitle="Informe o e-mail da conta. Se ele estiver cadastrado, você recebe um link para criar uma nova senha."
      notice={<>O link vale por pouco tempo e só pode ser usado uma vez. Ao trocar a senha, todas as sessões abertas são encerradas.</>}>
      <ForgotPasswordForm />
      <AuthAlternative href="/login" label="Voltar para o login" />
    </AuthShell>
  );
}
