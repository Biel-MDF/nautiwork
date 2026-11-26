import { notFound } from "next/navigation";
import { companyPublic } from "@/modules/public-data";
import { responseStats } from "@/modules/hiring";
import { ResponseBadge } from "@/components/ResponseBadge";
import { Empty, JobCard } from "@/components/ui";
import { CompanyMark } from "@/components/CompanyMark";
import { CompanyName } from "@/components/CompanyName";
import { jobViewer } from "@/modules/viewer";
import type { Metadata } from "next";
import { splitDemo } from "@/lib/display";
import { snippet } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = await companyPublic((await props.params).id);
  if (!c || !c.user.active) return { title: "Empresa não encontrada — Nautiwork", robots: { index: false } };
  const { name, demo } = splitDemo(c.name);
  const description = snippet(`${c.jobs.length} ${c.jobs.length === 1 ? "vaga aberta" : "vagas abertas"}${c.location ? ` em ${c.location}` : ""}. ${c.description ?? ""}`);
  return { title: `${name}: vagas abertas | Nautiwork`, description, alternates: { canonical: `/companies/${c.id}` },
    openGraph: { title: `${name} no Nautiwork`, description, url: `/companies/${c.id}` }, robots: demo ? { index: false, follow: true } : undefined };
}
export default async function CompanyPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const c = await companyPublic(params.id);
  if (!c || !c.user.active) notFound();
  const [viewer, stats] = await Promise.all([jobViewer(), responseStats([c.id]).then((m) => m.get(c.id) ?? null)]);
  return (<>
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-4">
        <CompanyMark userId={c.user.id} name={c.name} imageVersion={c.user.image ? c.user.image.updatedAt.getTime() : null} size={64} />
        <div className="min-w-0 break-words">
          <h1 className="text-3xl font-bold"><CompanyName name={c.name} /></h1>
          <p className="mt-1 text-abyss/70">{[c.industry, c.location].filter(Boolean).join(" • ") || "Informações em breve"}</p>
        </div>
      </div>
      <div className="mt-4"><ResponseBadge stats={stats} /></div>
      {c.description && <p className="mt-4 whitespace-pre-line break-words">{c.description}</p>}
      {c.website && <a className="mt-2 inline-block break-all text-tide" href={c.website} rel="noopener noreferrer nofollow" target="_blank">{c.website}</a>}
      <h2 className="mb-4 mt-8 text-xl font-bold">Vagas abertas</h2>
      {c.jobs.length === 0 ? <Empty title="Sem vagas abertas" hint="Volte mais tarde para ver novas oportunidades." /> : <div className="grid gap-4">{c.jobs.map((j) => <JobCard key={j.id} job={j} save={viewer.save(j.id)} score={viewer.score(j)} />)}</div>}
    </main>
  </>);
}
