import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { Empty } from "@/components/ui";
import { CompanyMark } from "@/components/CompanyMark";
import { CompanyName } from "@/components/CompanyName";

export const dynamic = "force-dynamic";
const date = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export default async function ResumeViews() {
  const user = await requirePageRole("CANDIDATE");
  const views = await db.resumeView.findMany({
    where: { candidate: { userId: user.id } }, orderBy: { lastAt: "desc" },
    include: { company: { select: { id: true, name: true, userId: true, industry: true, user: { select: { image: { select: { updatedAt: true } } } } } } },
  });
  return (
    <Shell role="CANDIDATE" title="Quem viu meu currículo">
      <p className="mb-5 max-w-[68ch] text-sm text-abyss/70">Empresas que abriram o seu currículo completo depois de você se candidatar a uma vaga delas. Só você vê esta lista.</p>
      {views.length === 0 ? <Empty title="Nenhuma empresa abriu seu currículo ainda" hint="Quando uma empresa abrir, ela aparece aqui e você recebe um aviso." href="/jobs" cta="Buscar vagas" /> :
        <ul className="grid gap-3 sm:grid-cols-2">{views.map((v) => (
          <li key={v.id} className="card flex items-start gap-3">
            <CompanyMark userId={v.company.userId} name={v.company.name} imageVersion={v.company.user.image ? v.company.user.image.updatedAt.getTime() : null} size={44} />
            <div className="min-w-0">
              <Link href={`/companies/${v.company.id}`} className="font-semibold hover:text-tide"><CompanyName name={v.company.name} /></Link>
              {v.company.industry && <p className="text-sm text-abyss/70">{v.company.industry}</p>}
              <p className="mt-1 text-sm">Abriu {v.count} {v.count === 1 ? "vez" : "vezes"}; a última em <time dateTime={v.lastAt.toISOString()}>{date(v.lastAt)}</time></p>
              {v.count > 1 && <p className="text-xs text-abyss/60">Primeira vez em {date(v.firstAt)}</p>}
            </div>
          </li>))}</ul>}
    </Shell>
  );
}
