import Link from "next/link";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { TERMS_UPDATED_LABEL, TERMS_VERSION } from "@/lib/legal";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Layout comum da Política de Privacidade e dos Termos: índice lateral fixo e texto em coluna legível. */
export function LegalPage({ title, intro, sections, other }: {
  title: string; intro: React.ReactNode; sections: LegalSection[]; other: { href: string; label: string };
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-14">
        <header className="max-w-[68ch]">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-abyss/60">Atualizada em {TERMS_UPDATED_LABEL} <span className="whitespace-nowrap">(versão {TERMS_VERSION})</span></p>
          <div className="mt-6 text-lg leading-relaxed text-abyss/80">{intro}</div>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Nesta página" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-semibold text-abyss/70">Nesta página</p>
            <ol className="mt-3 space-y-1 border-l border-mist text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-abyss/70 hover:border-tide hover:text-abyss">
                    <span className="tabular mr-2 text-abyss/45">{i + 1}.</span>{s.title}
                  </a>
                </li>
              ))}
            </ol>
            <Link href={other.href} className="mt-6 inline-block text-sm font-semibold text-tide hover:underline">{other.label}</Link>
          </nav>

          <div className="max-w-[68ch] space-y-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-24">
                <h2 id={`${s.id}-t`} className="text-2xl font-semibold"><span className="tabular mr-3 text-abyss/40">{i + 1}</span>{s.title}</h2>
                <div className="legal mt-4 space-y-4 leading-relaxed text-abyss/80">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
