import Form from "next/form";
import { CompanyName } from "@/components/CompanyName";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Avatar, Empty, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
const year = (d: Date | null) => (d ? d.getUTCFullYear() : "atual");

// Só aparecem candidatos que se candidataram a alguma vaga desta empresa.
export default async function CompanyCandidates(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const user = await requirePageRole("COMPANY");
  const q = (searchParams.q ?? "").trim().slice(0, 60);
  const candidates = await db.candidateProfile.findMany({
    where: {
      applications: { some: { job: { company: { userId: user.id } } } },
      user: { active: true },
      ...(q ? { OR: [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { headline: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { skills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } },
      ] } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: { select: { updatedAt: true } } } },
      skills: { include: { skill: true } },
      experiences: { orderBy: { startDate: "desc" }, take: 1 },
      applications: { where: { job: { company: { userId: user.id } } }, include: { job: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { user: { name: "asc" } },
    take: 100,
  });
  return (
    <Shell role="COMPANY" title="Candidatos">
      <Form action="/company/candidates" scroll={false} className="mb-4 flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="q">Buscar candidatos</label>
        <input id="q" name="q" defaultValue={q} className="input max-w-xs" placeholder="Nome, cidade ou habilidade" />
        <button className="btn-ghost">Buscar</button>
        {q && <Link href="/company/candidates" className="btn-ghost">Limpar</Link>}
      </Form>
      {candidates.length === 0 ? <Empty title={q ? "Nenhum candidato encontrado" : "Nenhum candidato ainda"}
        hint={q ? "Tente outro termo de busca." : "Quem se candidatar às suas vagas aparece aqui, com currículo e histórico."} /> :
        <ul className="space-y-3">{candidates.map((c) => (
          <li key={c.id} className="card space-y-3">
            <div className="flex items-start gap-3">
              <Avatar userId={c.user.id} name={c.user.name} version={c.user.image?.updatedAt} />
              <div className="min-w-0 break-words">
                <p className="font-semibold"><CompanyName name={c.user.name} person /></p>
                <p className="text-sm text-abyss/70">{c.headline ?? "Sem título profissional"} • {c.location ?? "Cidade não informada"} • {c.yearsExperience} {c.yearsExperience === 1 ? "ano" : "anos"} de experiência</p>
                <p className="text-sm"><a className="text-tide hover:underline" href={`mailto:${c.user.email}`}>{c.user.email}</a></p>
              </div>
            </div>
            {c.skills.length > 0 ? <div className="flex flex-wrap gap-1.5">{c.skills.map((s) => <span key={s.skill.id} className="chip">{s.skill.name}</span>)}</div>
              : <p className="text-sm text-abyss/60">Habilidades não informadas.</p>}
            {c.experiences[0] && <p className="text-sm text-abyss/80">Último cargo: {c.experiences[0].role} em {c.experiences[0].company} ({year(c.experiences[0].startDate)} – {year(c.experiences[0].endDate)})</p>}
            <Link href={`/company/candidates/${c.id}`} className="btn-ghost">Ver currículo completo</Link>
            <div className="text-sm"><p className="font-semibold">Candidaturas nas suas vagas</p>
              <ul className="mt-1 space-y-1">{c.applications.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2">
                  <Link href={`/company/applications?job=${a.job.id}`} className="hover:text-tide">{a.job.title}</Link>
                  {a.compatibility !== null && <span className="tabular text-abyss/70">{a.compatibility}% de compatibilidade</span>}
                  <StatusBadge status={a.status} />
                </li>))}</ul></div>
          </li>))}</ul>}
    </Shell>
  );
}
