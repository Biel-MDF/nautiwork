import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ValidateProjectForm } from "@/components/differentials";
import { projectByToken } from "@/modules/projects.service";

export const dynamic = "force-dynamic";
// o link é pessoal: não indexar nem repassar o endereço para outros sites
export const metadata: Metadata = { title: "Confirmar projeto — Nautiwork", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** Página aberta pelo professor, sem conta, para confirmar a autoria de um projeto. */
export default async function ValidateProject(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const project = await projectByToken(token);
  if (!project || project.validatedAt) return (
    <>
      <PageHeader title="Link sem validade" description="Este link já foi usado ou não existe. Se você é o professor, peça ao aluno um link novo." />
      <main className="mx-auto max-w-2xl px-4 py-10" />
    </>
  );
  const student = project.candidate.user.name.replace(/\[[^\]]*\]\s*/g, "");
  return (
    <>
      <PageHeader title="Confirmar projeto de aluno" description={`${student} indicou você como professor responsável por este projeto. Confirme só se acompanhou o trabalho.`} />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <article className="card text-sm">
          <h2 className="font-display text-lg font-semibold">{project.title}</h2>
          <p className="text-abyss/70">{project.school}</p>
          <p className="mt-3 whitespace-pre-line break-words leading-relaxed">{project.description}</p>
          {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-block break-all font-medium text-tide hover:underline">{project.url}</a>}
        </article>
        <ValidateProjectForm token={token} teacherName={project.teacherName} />
        <p className="text-xs text-abyss/60">Seu nome e seu e-mail ({project.teacherEmail}) aparecem para as empresas junto com a confirmação. Não é preciso criar conta. Se você não conhece este projeto, apenas feche a página.</p>
      </main>
    </>
  );
}
