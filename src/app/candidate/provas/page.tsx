import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { SkillQuiz } from "@/components/differentials";
import { PASS_SCORE, QUESTIONS_PER_TEST, RETRY_DAYS, SKILL_TESTS, TIME_LIMIT_MIN, testForSkill } from "@/modules/skill-tests/bank";
import { coursesFor } from "@/modules/courses";

const DAY = 86_400_000;

export const dynamic = "force-dynamic";
export default async function ProvasPage(props: { searchParams: Promise<{ prova?: string }> }) {
  const { prova } = await props.searchParams;
  const user = await requirePageRole("CANDIDATE");
  const p = await db.candidateProfile.findUnique({ where: { userId: user.id },
    select: { skills: { select: { skill: { select: { name: true } } } }, skillChecks: { where: { finishedAt: { not: null } }, orderBy: { finishedAt: "desc" } } } });
  const mySlugs = new Set((p?.skills ?? []).map((s) => testForSkill(s.skill.name)?.slug).filter(Boolean));
  const now = Date.now();
  // as provas das habilidades do perfil vêm primeiro
  const tests = [...SKILL_TESTS].sort((a, b) => Number(mySlugs.has(b.slug)) - Number(mySlugs.has(a.slug)));
  const current = prova ? tests.find((t) => t.slug === prova) : null;
  const stateOf = (slug: string) => {
    const checks = p?.skillChecks.filter((c) => c.skill === slug) ?? [];
    const passed = checks.find((c) => c.passed);
    const last = checks[0];
    const wait = last && !passed ? Math.ceil((RETRY_DAYS * DAY - (now - last.finishedAt!.getTime())) / DAY) : 0;
    return { passed, last, wait: wait > 0 ? wait : 0 };
  };

  if (current) {
    const st = stateOf(current.slug);
    return (
      <Shell role="CANDIDATE" title={`Prova de ${current.name}`}>
        <div className="max-w-2xl space-y-5">
          <Link href="/candidate/provas" className="tap text-sm font-medium text-tide hover:underline">Todas as provas</Link>
          <section className="card space-y-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-abyss/80">
              <li>{QUESTIONS_PER_TEST} questões sorteadas, {TIME_LIMIT_MIN} minutos. O tempo começa quando você clicar em começar.</li>
              <li>Passa quem acertar {PASS_SCORE} ou mais. A habilidade ganha o selo &quot;comprovada&quot; no currículo.</li>
              <li>Se não passar, pode tentar de novo depois de {RETRY_DAYS} dias. Sair no meio conta como tentativa.</li>
            </ul>
            <SkillQuiz slug={current.slug} name={current.name}
              disabledReason={st.passed ? `Você já passou nesta prova em ${st.passed.finishedAt!.toLocaleDateString("pt-BR")}.` : st.wait ? `Nova tentativa liberada em ${st.wait} ${st.wait === 1 ? "dia" : "dias"}.` : null} />
          </section>
          {!st.passed && <p className="text-sm text-abyss/70">Para estudar antes: {coursesFor(current.name).map((c, i) => <span key={c.url}>{i > 0 && ", "}<a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium text-tide hover:underline">{c.provider}</a></span>)} (cursos gratuitos).</p>}
        </div>
      </Shell>
    );
  }

  return (
    <Shell role="CANDIDATE" title="Provas de habilidade">
      <p className="mb-5 max-w-[70ch] text-sm text-abyss/75">Sem experiência para mostrar? Comprove o que você sabe. Cada prova tem {QUESTIONS_PER_TEST} questões e {TIME_LIMIT_MIN} minutos; quem passa ganha o selo &quot;comprovada&quot; na habilidade, que as empresas veem no seu currículo e nas candidaturas.</p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{tests.map((t) => {
        const st = stateOf(t.slug);
        return (
          <li key={t.slug} className="card flex flex-col">
            <div className="flex items-start justify-between gap-2"><h2 className="font-display font-semibold">{t.name}</h2>
              {mySlugs.has(t.slug) && <span className="chip text-xs">No seu perfil</span>}</div>
            <p className="mt-2 flex-1 text-sm text-abyss/75">{st.passed ? <span className="font-semibold text-abyss">Comprovada ({st.passed.score} de {st.passed.total})</span>
              : st.last ? `Última tentativa: ${st.last.score} de ${st.last.total}.${st.wait ? ` Nova tentativa em ${st.wait} ${st.wait === 1 ? "dia" : "dias"}.` : ""}` : "Ainda não feita."}</p>
            {!st.passed && <Link href={`/candidate/provas?prova=${t.slug}`} className="btn-ghost mt-4">{st.wait ? "Ver detalhes" : "Fazer a prova"}</Link>}
          </li>);
      })}</ul>
    </Shell>
  );
}
