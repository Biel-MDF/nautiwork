import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/app-url";
import { splitDemo } from "@/lib/display";

export const revalidate = 3600;

/**
 * Páginas públicas, vagas abertas e empresas ativas. Conteúdo da demonstração fica de fora:
 * vagas fictícias não devem aparecer em buscadores (o Google trata vaga falsa como spam).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [jobs, companies] = await Promise.all([
    db.job.findMany({ where: { status: "ACTIVE", flagged: false, company: { user: { active: true } } }, select: { id: true, updatedAt: true, company: { select: { name: true } } } }),
    db.companyProfile.findMany({ where: { user: { active: true }, OR: [{ user: { role: { not: "ADMIN" } } }, { jobs: { some: { status: "ACTIVE", flagged: false } } }] }, select: { id: true, name: true } }),
  ]);
  const pages = ["", "/jobs", "/companies", "/mercado", "/primeiro-emprego", "/app", "/assistente", "/about", "/qr", "/privacidade", "/termos", "/register"].map((p) => ({
    url: `${base}${p}`, changeFrequency: p === "" || p === "/jobs" ? "daily" as const : "monthly" as const, priority: p === "" ? 1 : 0.6,
  }));
  return [
    ...pages,
    ...jobs.filter((j) => !splitDemo(j.company.name).demo).map((j) => ({ url: `${base}/jobs/${j.id}`, lastModified: j.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...companies.filter((c) => !splitDemo(c.name).demo).map((c) => ({ url: `${base}/companies/${c.id}`, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
