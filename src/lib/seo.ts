import { siteUrl } from "./app-url";
import { splitDemo } from "./display";

type SeoJob = {
  id: string; title: string; description: string; responsibilities: string | null; requirements: string | null;
  location: string; workMode: string; contractType: string; salaryMin: number | null; salaryMax: number | null;
  publishedAt: Date; company: { name: string; website: string | null };
};

const employment: Record<string, string> = { CLT: "FULL_TIME", PJ: "CONTRACTOR", INTERNSHIP: "INTERN", TEMPORARY: "TEMPORARY" };

/** Resumo de até ~155 caracteres para a descrição nos resultados de busca. */
export function snippet(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, clean.lastIndexOf(" ", max - 1)) + "…";
}

/**
 * Dados estruturados JobPosting (schema.org), lidos pelo Google para o "Google for Jobs".
 * Vagas da demonstração não recebem: anunciar vaga fictícia ao Google viola as regras dele.
 */
export function jobPostingJsonLd(job: SeoJob) {
  const company = splitDemo(job.company.name);
  if (company.demo) return null;
  const html = [job.description, job.responsibilities && `Responsabilidades:\n${job.responsibilities}`, job.requirements && `Requisitos:\n${job.requirements}`]
    .filter(Boolean).join("\n\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
  const data: Record<string, unknown> = {
    "@context": "https://schema.org/", "@type": "JobPosting",
    title: job.title, description: html, datePosted: job.publishedAt.toISOString(),
    employmentType: employment[job.contractType] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: company.name, ...(job.company.website ? { sameAs: job.company.website } : {}) },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "BR" } },
    directApply: true, url: `${siteUrl()}/jobs/${job.id}`,
  };
  if (job.workMode === "REMOTE") {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = { "@type": "Country", name: "Brasil" };
  }
  if (job.salaryMin || job.salaryMax) {
    data.baseSalary = { "@type": "MonetaryAmount", currency: "BRL",
      value: { "@type": "QuantitativeValue", unitText: "MONTH", ...(job.salaryMin ? { minValue: job.salaryMin } : {}), ...(job.salaryMax ? { maxValue: job.salaryMax } : {}) } };
  }
  return data;
}

/** JSON dentro de <script>: escapa "<" para ninguém fechar a tag com o texto da vaga. */
export function jsonLdScript(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
