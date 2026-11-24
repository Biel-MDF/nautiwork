import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty, JobCard, Stat, StatusBadge } from "@/components/ui";
import { computeCompatibility } from "@/modules/compatibility";
import { NotificationList } from "@/components/account-forms";
import { VerifyEmailBanner } from "@/components/email-forms";

export const dynamic = "force-dynamic";

export default async function CandidateDashboard() {
  const user = await requirePageRole("CANDIDATE");
  const profile = await db.candidateProfile.findUnique({ where: { userId: user.id },
    include: { skills: { include: { skill: true } }, applications: { orderBy: { createdAt: "desc" }, take: 5, include: { job: { include: { company: true } } } }, _count: { select: { savedJobs: true, applications: true } } } });
  if (!profile) return <Shell role="CANDIDATE" title="Painel"><Empty title="Perfil não encontrado" hint="Entre em contato com o suporte." /></Shell>;

  const checks = [profile.headline, profile.about, profile.location, profile.interestArea, profile.workMode, profile.skills.length > 0];
  const progress = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const applied = new Set((await db.jobApplication.findMany({ where: { candidateId: profile.id }, select: { jobId: true } })).map((a) => a.jobId));
  const jobs = await db.job.findMany({ where: { status: "ACTIVE", flagged: false, company: { user: { active: true } } }, orderBy: { publishedAt: "desc" }, take: 50,
    include: { company: { select: { id: true, name: true } }, skills: { include: { skill: true } } } });
  const mine = { skills: profile.skills.map((s) => s.skill.name), interestArea: profile.interestArea, workMode: profile.workMode, location: profile.location, yearsExperience: profile.yearsExperience };
  const recommended = jobs.filter((j) => !applied.has(j.id))
    .map((j) => ({ j, score: computeCompatibility(mine, { skills: j.skills.map((s) => s.skill.name), area: j.area, workMode: j.workMode, location: j.location, minYears: j.minYears }).score }))
    .sort((a, b) => b.score - a.score).slice(0, 4);
  const notes = await db.notification.findMany({ where: { userId: user.id }, orderBy: [{ read: "asc" }, { createdAt: "desc" }], take: 10 });

  return (
    <Shell role="CANDIDATE" title={`Olá, ${user.name.replace(/\[[^\]]*\]\s*/g, "").split(" ")[0]}`}>
      {!user.emailVerified && <VerifyEmailBanner email={user.email} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Perfil preenchido" value={`${progress}%`} /><Stat label="Candidaturas" value={profile._count.applications} /><Stat label="Vagas salvas" value={profile._count.savedJobs} />
      </div>
      {progress < 100 && <p className="mt-4 rounded-lg bg-foam p-3 text-sm">Complete seu perfil para melhorar a compatibilidade. <Link className="font-semibold text-tide" href="/candidate/profile">Editar perfil</Link></p>}
      <h2 className="mb-3 mt-8 text-lg font-bold">Vagas com maior compatibilidade</h2>
      {recommended.length === 0 ? <Empty title="Sem recomendações agora" hint="Quando houver vagas ativas, elas aparecem aqui ordenadas pela compatibilidade." href="/jobs" cta="Explorar vagas" />
        : <div className="grid gap-4 md:grid-cols-2">{recommended.map(({ j, score }) => <JobCard key={j.id} job={j} score={score} />)}</div>}
      <h2 className="mb-3 mt-8 text-lg font-bold">Candidaturas recentes</h2>
      {profile.applications.length === 0 ? <Empty title="Você ainda não se candidatou" hint="Encontre uma vaga e envie sua primeira candidatura." href="/jobs" cta="Buscar vagas" /> :
        <ul className="space-y-2">{profile.applications.map((a) => <li key={a.id} className="card flex items-center justify-between gap-3"><Link href={`/jobs/${a.jobId}`} className="font-semibold hover:text-tide">{a.job.title} <span className="font-normal text-abyss/70">• {a.job.company.name}</span></Link><StatusBadge status={a.status} /></li>)}</ul>}
      <h2 className="mb-3 mt-8 text-lg font-bold">Notificações</h2>
      <NotificationList items={notes.map((n) => ({ id: n.id, title: n.title, body: n.body, read: n.read, createdAt: n.createdAt.toISOString() }))} />
    </Shell>
  );
}
