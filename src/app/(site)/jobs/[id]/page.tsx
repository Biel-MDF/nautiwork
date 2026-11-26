import { notFound } from "next/navigation";
import { jobPublic } from "@/modules/public-data";
import { contractLabel, workModeLabel } from "@/lib/labels";
import { JobDetailPage, loadJobDetail } from "@/components/jobs/JobDetail";
import type { Metadata } from "next";
import { splitDemo } from "@/lib/display";
import { jobPostingJsonLd, jsonLdScript, snippet } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const job = await jobPublic((await props.params).id);
  if (!job || job.flagged || job.status === "CLOSED") return { title: "Vaga não encontrada — Nautiwork", robots: { index: false } };
  const company = splitDemo(job.company.name);
  const title = `${job.title} — ${company.name}`;
  const description = snippet(`${job.location}, ${workModeLabel[job.workMode]}, ${contractLabel[job.contractType]}. ${job.description}`);
  return {
    title: `${title} | Nautiwork`, description,
    alternates: { canonical: `/jobs/${job.id}` },
    openGraph: { title, description, type: "website", url: `/jobs/${job.id}` },
    // vagas fictícias da demonstração não devem ser indexadas
    robots: company.demo ? { index: false, follow: true } : undefined,
  };
}

export default async function JobPage(props: { params: Promise<{ id: string }> }) {
  const d = await loadJobDetail((await props.params).id);
  if (!d) notFound();
  const jsonLd = d.job.status === "ACTIVE" && !d.job.flagged ? jobPostingJsonLd(d.job) : null;
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />}
      <JobDetailPage d={d} />
    </>
  );
}
