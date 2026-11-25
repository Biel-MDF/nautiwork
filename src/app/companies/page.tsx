import Link from "next/link";
import { db } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Empty } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { CompanyMark } from "@/components/CompanyMark";
import { CompanyName } from "@/components/CompanyName";

export const dynamic = "force-dynamic";
export const metadata = { title: "Empresas — Nautiwork" };
export default async function Companies() {
  const companies = await db.companyProfile.findMany({ where: { user: { active: true } }, orderBy: [{ jobs: { _count: "desc" } }, { name: "asc" }], include: { user: { select: { id: true, image: { select: { updatedAt: true } } } }, _count: { select: { jobs: { where: { status: "ACTIVE", flagged: false } } } } } });
  return (<>
    <Navbar />
    <PageHeader title="Empresas" description="Quem está contratando pelo Nautiwork. Abra uma empresa para ver o que ela faz e todas as vagas abertas dela."
      stats={[["Empresas", companies.length], ["Com vagas abertas", companies.filter((c) => c._count.jobs > 0).length], ["Vagas abertas", companies.reduce((n, c) => n + c._count.jobs, 0)]]} />
    <main className="mx-auto max-w-6xl px-4 py-10">
      {companies.length === 0 ? <Empty title="Nenhuma empresa cadastrada" hint="Crie uma conta de empresa para aparecer aqui." href="/register" cta="Cadastrar empresa" /> :
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{companies.map((c) => (
          <Link key={c.id} href={`/companies/${c.id}`} className="card flex gap-4 transition-colors hover:border-tide/60"><CompanyMark userId={c.user.id} name={c.name} imageVersion={c.user.image ? c.user.image.updatedAt.getTime() : null} size={52} /><div className="min-w-0 break-words"><h2 className="font-semibold"><CompanyName name={c.name} /></h2><p className="text-sm text-abyss/70">{[c.industry ?? "Área não informada", c.location].filter(Boolean).join(", ")}</p><p className="mt-3 text-sm"><span className="tabular font-semibold">{c._count.jobs}</span> <span className="text-abyss/70">{c._count.jobs === 1 ? "vaga aberta" : "vagas abertas"}</span></p></div></Link>))}</div>}
    </main>
    <Footer />
  </>);
}
