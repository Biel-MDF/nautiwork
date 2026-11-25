import { RegisterForm } from "@/components/forms";
import { AuthAlternative, AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Criar conta — Nautiwork" };

export default async function Register(props: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await props.searchParams;
  const company = tipo === "empresa";
  return (
    <AuthShell title="Crie sua conta"
      subtitle={company ? "Publique vagas e receba candidaturas organizadas, sem custo." : "Um perfil só para todas as candidaturas. Leva poucos minutos."}>
      <RegisterForm initialRole={company ? "COMPANY" : "CANDIDATE"} />
      <AuthAlternative href="/login" label="Já tenho conta" />
    </AuthShell>
  );
}
