import Link from "next/link";
import { db } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Avatar, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";
export default async function Companies() {
  const companies = await db.companyProfile.findMany({ where: { user: { active: true } }, orderBy: { name: "asc" }, include: { user: { select: { id: true, image: { select: { updatedAt: true } } } }, _count: { select: { jobs: { where: { status: "ACTIVE", flagged: false } } } } } });
  return (<>
    <Navbar />
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Empresas</h1>
      {companies.length === 0 ? <Empty title="Nenhuma empresa cadastrada" hint="Crie uma conta de empresa para aparecer aqui." href="/register" cta="Cadastrar empresa" /> :
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{companies.map((c) => (
          <Link key={c.id} href={`/companies/${c.id}`} className="card flex gap-3 hover:border-tide"><Avatar userId={c.user.id} name={c.name} version={c.user.image?.updatedAt} /><div className="min-w-0 break-words"><h2 className="font-semibold">{c.name}</h2><p className="text-sm text-abyss/70">{c.industry ?? "Área não informada"} {c.location ? `• ${c.location}` : ""}</p><p className="mt-2 text-sm">{c._count.jobs} {c._count.jobs === 1 ? "vaga ativa" : "vagas ativas"}</p></div></Link>))}</div>}
    </main>
    <Footer />
  </>);
}
