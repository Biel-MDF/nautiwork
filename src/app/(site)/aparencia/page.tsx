import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { AppearancePanel, ThemeEditor } from "@/components/ThemePicker";
import { PALETTE_IDS } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Aparência — Nautiwork",
  description: "Escolha a paleta, o modo claro ou escuro, ou monte o seu próprio tema com as cores do site.",
  robots: { index: false },
};

export default function Aparencia() {
  return (
    <>
      <PageHeader title="Aparência" description="Escolha uma paleta pronta, o modo claro ou escuro, ou monte o seu tema com as cores do site. A escolha fica salva neste aparelho." />
      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10">
        <section aria-labelledby="prontos" className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div>
            <h2 id="prontos" className="text-2xl font-semibold">Temas prontos</h2>
            <p className="mt-2 text-sm leading-relaxed text-abyss/70">{PALETTE_IDS.length} paletas, cada uma em versão clara e escura. No modo Sistema, o site acompanha o claro ou escuro do seu aparelho.</p>
          </div>
          <div className="card"><AppearancePanel editorLink={false} /></div>
        </section>
        <section id="meu-tema" aria-labelledby="meu" className="scroll-mt-24 space-y-5">
          <div className="max-w-[64ch]">
            <h2 id="meu" className="text-2xl font-semibold">Criar meu tema</h2>
            <p className="mt-2 text-sm leading-relaxed text-abyss/70">Cada linha da tabela é uma parte do site; cada coluna, uma das paletas. Escolha uma cor por linha. O site muda na hora, e a prévia mostra o resultado no modo atual.</p>
          </div>
          <ThemeEditor />
        </section>
      </main>
    </>
  );
}
