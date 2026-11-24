import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { AccountNameForm, ImageUpload, PasswordForm } from "@/components/account-forms";

export const dynamic = "force-dynamic";
export default async function CandidateSettings() {
  const session = await requirePageRole("CANDIDATE");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.id }, include: { image: { select: { updatedAt: true } } } });
  return (
    <Shell role="CANDIDATE" title="Configurações">
      <div className="space-y-6">
        <section className="card" aria-labelledby="photo-title">
          <h2 id="photo-title" className="mb-1 text-lg font-bold">Foto</h2>
          <p className="mb-4 text-sm text-abyss/70">Só você, a administração e as empresas das vagas em que você se candidatou podem ver a foto.</p>
          <ImageUpload userId={user.id} version={user.image ? String(user.image.updatedAt.getTime()) : null} label="Foto de perfil" />
        </section>
        <section className="card" aria-labelledby="acc-title">
          <h2 id="acc-title" className="mb-1 text-lg font-bold">Dados da conta</h2>
          <p className="mb-4 text-sm text-abyss/70">E-mail de acesso: {user.email}</p>
          <AccountNameForm name={user.name} />
        </section>
        <section className="card" aria-labelledby="pw-title">
          <h2 id="pw-title" className="mb-4 text-lg font-bold">Alterar senha</h2>
          <PasswordForm />
        </section>
      </div>
    </Shell>
  );
}
