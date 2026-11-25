import { splitDemo } from "@/lib/display";
import { CompanyName } from "@/components/CompanyName";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty, Stat, StatusBadge } from "@/components/ui";
import { NotificationList } from "@/components/account-forms";
import { VerifyEmailBanner } from "@/components/email-forms";

export const dynamic = "force-dynamic";
export default async function CompanyDashboard() {
  const user = await requirePageRole("COMPANY");
  const company = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!company) return <Shell role="COMPANY" title="Painel"><Empty title="Perfil da empresa não encontrado" hint="Entre em contato com o suporte." /></Shell>;
  const [active, paused, closed, total, inProcess, recent, notes] = await Promise.all([
    db.job.count({ where: { companyId: company.id, status: "ACTIVE" } }),
    db.job.count({ where: { companyId: company.id, status: "PAUSED" } }),
    db.job.count({ where: { companyId: company.id, status: "CLOSED" } }),
    db.jobApplication.count({ where: { job: { companyId: company.id } } }),
    db.jobApplication.count({ where: { job: { companyId: company.id }, status: { in: ["IN_REVIEW", "IN_PROCESS", "INTERVIEW"] } } }),
    db.jobApplication.findMany({ where: { job: { companyId: company.id } }, orderBy: { createdAt: "desc" }, take: 5, include: { job: true, candidate: { include: { user: true } } } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: [{ read: "asc" }, { createdAt: "desc" }], take: 10 }),
  ]);
  return (
    <Shell role="COMPANY" title={splitDemo(company.name).name}>
      {!user.emailVerified && <VerifyEmailBanner email={user.email} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Vagas ativas" value={active} /><Stat label="Pausadas" value={paused} /><Stat label="Encerradas" value={closed} /><Stat label="Candidaturas" value={total} /><Stat label="Em andamento" value={inProcess} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><Link href="/company/jobs/new" className="btn-primary">Nova vaga</Link><Link href="/company/applications" className="btn-ghost">Ver candidaturas</Link></div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Candidaturas recentes</h2>
      {recent.length === 0 ? <Empty title="Sem candidaturas ainda" hint="Publique uma vaga para começar a receber candidatos." href="/company/jobs/new" cta="Publicar vaga" /> :
        <ul className="space-y-2">{recent.map((a) => <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3"><span className="min-w-0 break-words"><span className="font-semibold"><CompanyName name={a.candidate.user.name} person /></span> • {a.job.title}</span><StatusBadge status={a.status} /></li>)}</ul>}
      <h2 className="mb-3 mt-8 text-lg font-bold">Notificações</h2>
      <NotificationList items={notes.map((n) => ({ id: n.id, title: n.title, body: n.body, read: n.read, createdAt: n.createdAt.toISOString() }))} />
    </Shell>
  );
}
