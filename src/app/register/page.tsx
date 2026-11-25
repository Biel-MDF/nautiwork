import Link from "next/link";
import { RegisterForm } from "@/components/forms";
import { AuthShell } from "@/components/AuthShell";
export default async function Register(props: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await props.searchParams;
  return (<AuthShell>
    <h1 className="mb-6 text-2xl font-semibold">Criar conta</h1><RegisterForm initialRole={tipo === "empresa" ? "COMPANY" : "CANDIDATE"} />
    <p className="mt-6 text-center text-sm text-abyss/75">Já tem conta? <Link className="font-semibold text-tide hover:underline" href="/login">Entrar</Link></p>
  </AuthShell>);
}
