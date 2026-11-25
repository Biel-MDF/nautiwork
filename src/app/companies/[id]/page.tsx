import { jobCardCompany } from "@/lib/queries";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Empty, JobCard } from "@/components/ui";
import { CompanyMark } from "@/components/CompanyMark";
import { CompanyName } from "@/components/CompanyName";
import { jobViewer } from "@/modules/viewer";

export const dynamic = "force-dynamic";
export default async function CompanyPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const c = await db.companyProfile.findUnique({ where: { id: params.id }, include: { user: { include: { image: { select: { updatedAt: true } } } },
    jobs: { where: { status: "ACTIVE", flagged: false }, orderBy: { publishedAt: "desc" }, include: { company: jobCardCompany, skills: { include: { skill: true } } } } } });
  if (!c || !c.user.active) notFound();
  const viewer = await jobViewer();
  return (<>
    <Navbar />
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-4">
        <CompanyMark userId={c.user.id} name={c.name} imageVersion={c.user.image ? c.user.image.updatedAt.getTime() : null} size={64} />
        <div className="min-w-0 break-words">
          <h1 className="text-3xl font-bold"><CompanyName name={c.name} /></h1>
          <p className="mt-1 text-abyss/70">{[c.industry, c.location].filter(Boolean).join(" • ") || "Informações em breve"}</p>
        </div>
      </div>
      {c.description && <p className="mt-4 whitespace-pre-line break-words">{c.description}</p>}
      {c.website && <a className="mt-2 inline-block break-all text-tide" href={c.website} rel="noopener noreferrer nofollow" target="_blank">{c.website}</a>}
      <h2 className="mb-4 mt-8 text-xl font-bold">Vagas abertas</h2>
      {c.jobs.length === 0 ? <Empty title="Sem vagas abertas" hint="Volte mais tarde para ver novas oportunidades." /> : <div className="grid gap-4">{c.jobs.map((j) => <JobCard key={j.id} job={j} save={viewer.save(j.id)} score={viewer.score(j)} />)}</div>}
    </main>
    <Footer />
  </>);
}
