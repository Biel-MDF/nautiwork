import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Avatar, Empty } from "@/components/ui";
import { AdminToggle } from "@/components/forms";

export const dynamic = "force-dynamic";
export default async function AdminCompanies() {
  await requirePageRole("ADMIN");
  const companies = await db.companyProfile.findMany({
    orderBy: { name: "asc" }, take: 200,
    include: {
      user: { select: { id: true, email: true, active: true, createdAt: true, image: { select: { updatedAt: true } } } },
      _count: { select: { jobs: true } },
      jobs: { select: { status: true, flagged: true, _count: { select: { applications: true } } } },
    },
  });
  return (
    <Shell role="ADMIN" title="Empresas">
      {companies.length === 0 ? <Empty title="Nenhuma empresa cadastrada" hint="Empresas aparecem aqui após o cadastro." /> :
        <ul className="space-y-2">{companies.map((c) => {
          const active = c.jobs.filter((j) => j.status === "ACTIVE").length;
          const flagged = c.jobs.filter((j) => j.flagged).length;
          const apps = c.jobs.reduce((n, j) => n + j._count.applications, 0);
          return (
            <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar userId={c.user.id} name={c.name} version={c.user.image?.updatedAt} size={40} />
                <div className="min-w-0 break-words">
                  <Link href={`/companies/${c.id}`} className="font-semibold hover:text-tide">{c.name}</Link>
                  <p className="text-sm text-abyss/70">{c.user.email} • {c.industry ?? "área não informada"} • {c.location ?? "cidade não informada"}</p>
                  <p className="text-sm">{c._count.jobs} vagas ({active} ativas{flagged ? `, ${flagged} retidas` : ""}) • {apps} candidaturas • conta {c.user.active ? "ativa" : "desativada"} • desde {c.user.createdAt.toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <AdminToggle url={`/api/admin/users/${c.user.id}`} field="active" value={c.user.active} onLabel="Desativar empresa" offLabel="Reativar empresa" />
            </li>);
        })}</ul>}
    </Shell>
  );
}
