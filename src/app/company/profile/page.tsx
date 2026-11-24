import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { AccountNameForm, CompanyProfileForm, ImageUpload, PasswordForm } from "@/components/account-forms";

export const dynamic = "force-dynamic";
export default async function CompanyProfilePage() {
  const session = await requirePageRole("COMPANY");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.id }, include: { company: true, image: { select: { updatedAt: true } } } });
  const c = user.company;
  if (!c) return <Shell role="COMPANY" title="Perfil da empresa"><Empty title="Perfil da empresa não encontrado" hint="Entre em contato com o suporte." /></Shell>;
  return (
    <Shell role="COMPANY" title="Perfil da empresa">
      <div className="space-y-6">
        <p className="text-sm text-abyss/70">Estas informações aparecem na <Link href={`/companies/${c.id}`} className="font-semibold text-tide">página pública da empresa</Link>.</p>
        <section className="card" aria-labelledby="logo-title">
          <h2 id="logo-title" className="mb-4 text-lg font-bold">Logotipo</h2>
          <ImageUpload userId={user.id} version={user.image ? String(user.image.updatedAt.getTime()) : null} label="Logotipo" />
        </section>
        <CompanyProfileForm initial={{ name: c.name, description: c.description ?? "", industry: c.industry ?? "", website: c.website ?? "", location: c.location ?? "" }} />
        <section className="card" aria-labelledby="acc-title">
          <h2 id="acc-title" className="mb-1 text-lg font-bold">Conta de acesso</h2>
          <p className="mb-4 text-sm text-abyss/70">E-mail de acesso: {user.email}</p>
          <AccountNameForm name={user.name} />
          <h3 className="mb-3 mt-6 font-semibold">Alterar senha</h3>
          <PasswordForm />
        </section>
      </div>
    </Shell>
  );
}
