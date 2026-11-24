import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { AdminToggle } from "@/components/forms";

export const dynamic = "force-dynamic";
const roleLabel = { CANDIDATE: "Candidato", COMPANY: "Empresa", ADMIN: "Administrador" } as const;
export default async function AdminUsers() {
  const admin = await requirePageRole("ADMIN");
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <Shell role="ADMIN" title="Usuários">
      <ul className="space-y-2">{users.map((u) => (
        <li key={u.id} className="card flex flex-wrap items-center justify-between gap-3">
          <div><p className="font-semibold">{u.name}</p><p className="text-sm text-abyss/70">{u.email} • {roleLabel[u.role]} • {u.active ? "ativa" : "desativada"}</p></div>
          {u.id !== admin.id && <AdminToggle url={`/api/admin/users/${u.id}`} field="active" value={u.active} onLabel="Desativar" offLabel="Reativar" />}
        </li>))}</ul>
    </Shell>
  );
}
