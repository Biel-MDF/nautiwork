import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/rbac";
import { PageHeader } from "@/components/PageHeader";
import { CheckinForm } from "@/components/differentials";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acompanhamento — Nautiwork", robots: { index: false, follow: false } };
const clean = (n: string) => n.replace(/\[[^\]]*\]\s*/g, "");

/** Pergunta de 30, 60 ou 90 dias depois da contratação. Cada lado responde a sua. */
export default async function CheckinPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const user = await requirePageUser();
  const c = await db.hireCheckin.findUnique({ where: { id }, include: { application: { include: {
    candidate: { select: { userId: true, user: { select: { name: true } } } }, job: { select: { title: true, company: { select: { userId: true, name: true } } } } } } } });
  if (!c) notFound();
  const owner = c.role === "CANDIDATE" ? c.application.candidate.userId : c.application.job.company.userId;
  if (owner !== user.id) notFound();
  const role = c.role as "CANDIDATE" | "COMPANY";
  const other = role === "CANDIDATE" ? clean(c.application.job.company.name) : clean(c.application.candidate.user.name);
  return (
    <>
      <PageHeader title={`${c.day} dias de contratação`} description={role === "CANDIDATE"
        ? "Uma pergunta rápida para saber como está indo. Sua nota e seu comentário ficam só com você e com a equipe do Nautiwork."
        : "Uma pergunta rápida sobre a adaptação de quem foi contratado pela plataforma."} />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="mb-4 text-sm text-abyss/70">Vaga: {c.application.job.title}</p>
        {c.answeredAt ? <p className="card text-sm">Você já respondeu esta pergunta em {c.answeredAt.toLocaleDateString("pt-BR")}.</p>
          : <CheckinForm id={c.id} role={role} day={c.day} other={other} />}
      </main>
    </>
  );
}
