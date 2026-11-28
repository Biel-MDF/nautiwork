import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { AdminToggle } from "@/components/forms";
import { EmperorBadge } from "@/components/Crown";

export const dynamic = "force-dynamic";
const roleLabel = { CANDIDATE: "Candidato", COMPANY: "Empresa", ADMIN: "Administrador" } as const;
export default async function AdminUsers() {
  const admin = await requirePageRole("ADMIN");
  const me = await db.user.findUnique({ where: { id: admin.id }, select: { emperor: true } });
  // o Imperador aparece primeiro
  const users = await db.user.findMany({ orderBy: [{ emperor: "desc" }, { createdAt: "desc" }], take: 100 });
  const canToggle = (u: (typeof users)[number]) => u.id !== admin.id && !u.emperor && (u.role !== "ADMIN" || !!me?.emperor);
  return (
    <Shell role="ADMIN" title="Usuários">
      {me?.emperor && <p className="imp-card mb-4 rounded-control border p-3 text-sm text-abyss/80">Você é o Imperador: só você desativa ou reativa administradores, e nenhuma conta pode desativar a sua.</p>}
      <ul className="space-y-2">{users.map((u) => (
        <li key={u.id} className={`card flex flex-wrap items-center justify-between gap-3 ${u.emperor ? "imp-card" : ""}`}>
          <div><p className="flex flex-wrap items-center gap-2 font-semibold">{u.name}
            {u.emperor && <EmperorBadge />}</p>
            <p className="text-sm text-abyss/70">{u.email} • {u.emperor ? "Administrador maior" : roleLabel[u.role]} • {u.active ? "ativa" : "desativada"}</p></div>
          {canToggle(u) ? <AdminToggle url={`/api/admin/users/${u.id}`} field="active" value={u.active} onLabel="Desativar" offLabel="Reativar" />
            : u.id !== admin.id && (u.emperor || u.role === "ADMIN") && <p className="text-xs text-abyss/60">{u.emperor ? "Não pode ser desativado" : "Só o Imperador altera"}</p>}
        </li>))}</ul>
    </Shell>
  );
}
