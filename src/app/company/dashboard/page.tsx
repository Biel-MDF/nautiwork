import { splitDemo } from "@/lib/display";
import { CompanyName } from "@/components/CompanyName";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty, Stat, StatusBadge } from "@/components/ui";
import { NotificationList } from "@/components/account-forms";
import { VerifyEmailBanner } from "@/components/email-forms";
import { EXPIRY_WARN_DAYS, JOB_VALID_DAYS, NO_REPLY_DAYS, responseStats } from "@/modules/hiring";
import { ResponseBadge } from "@/components/ResponseBadge";

export const dynamic = "force-dynamic";
export default async function CompanyDashboard() {
  const user = await requirePageRole("COMPANY");
  const company = await db.companyProfile.findUnique({ where: { userId: user.id } });
  if (!company) return <Shell role="COMPANY" title="Painel"><Empty title="Perfil da empresa não encontrado" hint="Entre em contato com o suporte." /></Shell>;
  const now = Date.now(), DAY = 86_400_000;
  const [active, paused, closed, total, inProcess, recent, notes, expiring, expired, waiting, stats] = await Promise.all([
    db.job.count({ where: { companyId: company.id, status: "ACTIVE" } }),
    db.job.count({ where: { companyId: company.id, status: "PAUSED" } }),
    db.job.count({ where: { companyId: company.id, status: "CLOSED" } }),
    db.jobApplication.count({ where: { job: { companyId: company.id } } }),
    db.jobApplication.count({ where: { job: { companyId: company.id }, status: { in: ["IN_REVIEW", "IN_PROCESS", "INTERVIEW"] } } }),
    db.jobApplication.findMany({ where: { job: { companyId: company.id } }, orderBy: { createdAt: "desc" }, take: 5, include: { job: true, candidate: { include: { user: true } } } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: [{ read: "asc" }, { createdAt: "desc" }], take: 10 }),
    db.job.count({ where: { companyId: company.id, status: "ACTIVE", confirmedAt: { lt: new Date(now - (JOB_VALID_DAYS - EXPIRY_WARN_DAYS) * DAY) } } }),
    db.job.count({ where: { companyId: company.id, status: "PAUSED", expiredAt: { not: null } } }),
    db.jobApplication.count({ where: { job: { companyId: company.id }, status: "SUBMITTED", createdAt: { lt: new Date(now - NO_REPLY_DAYS * DAY) } } }),
    responseStats([company.id]).then((m) => m.get(company.id) ?? null),
  ]);
  const checkins = await db.hireCheckin.findMany({ where: { role: "COMPANY", answeredAt: null, application: { job: { companyId: company.id } } }, orderBy: { createdAt: "asc" },
    include: { application: { select: { job: { select: { title: true } }, candidate: { select: { user: { select: { name: true } } } } } } } });
  return (
    <Shell role="COMPANY" title={splitDemo(company.name).name}>
      {!user.emailVerified && <VerifyEmailBanner email={user.email} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Vagas ativas" value={active} /><Stat label="Pausadas" value={paused} /><Stat label="Encerradas" value={closed} /><Stat label="Candidaturas" value={total} /><Stat label="Em andamento" value={inProcess} />
      </div>
      <section aria-labelledby="saude" className="card mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="saude" className="font-display text-lg font-semibold">Como os candidatos veem sua empresa</h2>
            <p className="mt-1 text-sm text-abyss/70">{stats ? `Você respondeu ${stats.rate}% das candidaturas${stats.medianDays ? `, em ${stats.medianDays} ${stats.medianDays === 1 ? "dia" : "dias"} na mediana` : ""}.` : "Ainda não há candidaturas suficientes para medir o tempo de resposta."} Empresas que respondem 80% ou mais em até 7 dias ganham o selo nas vagas.</p>
          </div>
          <ResponseBadge stats={stats} />
        </div>
        {(expiring > 0 || expired > 0 || waiting > 0 || checkins.length > 0 || !company.cnpjVerifiedAt) && <ul className="mt-3 space-y-1.5 text-sm">
          {checkins.map((c) => <li key={c.id}><Link href={`/checkin/${c.id}`} className="text-tide hover:underline">Acompanhamento de {c.day} dias: <CompanyName name={c.application.candidate.user.name} person />, {c.application.job.title}</Link></li>)}
          {!company.cnpjVerifiedAt && <li><Link href="/company/cotas" className="text-tide hover:underline">Informe o CNPJ para ganhar o selo de empresa verificada nas vagas</Link></li>}
          {waiting > 0 && <li><Link href="/company/applications" className="text-tide hover:underline">{waiting} {waiting === 1 ? "candidatura espera" : "candidaturas esperam"} resposta há mais de {NO_REPLY_DAYS} dias</Link></li>}
          {expiring > 0 && <li><Link href="/company/jobs" className="text-tide hover:underline">{expiring} {expiring === 1 ? "vaga vence" : "vagas vencem"} em até {EXPIRY_WARN_DAYS} dias: confirme se ainda está contratando</Link></li>}
          {expired > 0 && <li><Link href="/company/jobs" className="text-tide hover:underline">{expired} {expired === 1 ? "vaga saiu" : "vagas saíram"} do ar por falta de confirmação</Link></li>}
        </ul>}
      </section>
      <div className="mt-4 flex flex-wrap gap-2"><Link href="/company/jobs/new" className="btn-primary">Nova vaga</Link><Link href="/company/applications" className="btn-ghost">Ver candidaturas</Link></div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Candidaturas recentes</h2>
      {recent.length === 0 ? <Empty title="Sem candidaturas ainda" hint="Publique uma vaga para começar a receber candidatos." href="/company/jobs/new" cta="Publicar vaga" /> :
        <ul className="space-y-2">{recent.map((a) => <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3"><span className="min-w-0 break-words"><span className="font-semibold"><CompanyName name={a.candidate.user.name} person /></span> • {a.job.title}</span><StatusBadge status={a.status} /></li>)}</ul>}
      <h2 className="mb-3 mt-8 text-lg font-bold">Notificações</h2>
      <NotificationList items={notes.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, read: n.read, createdAt: n.createdAt.toISOString() }))} />
    </Shell>
  );
}
