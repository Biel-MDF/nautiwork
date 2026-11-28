import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { InstallApp } from "@/components/InstallApp";

export const metadata: Metadata = {
  title: "Nautiwork no celular — instale o app",
  description: "Instale o Nautiwork no Android ou no iPhone: ícone na tela inicial, tela cheia e o assistente de carreira com IA.",
  alternates: { canonical: "/app" },
};

const features = [
  ["Ícone na tela inicial", "Abre direto, em tela cheia, sem barra do navegador."],
  ["Assistente com IA", "Acha vagas que combinam com você, revisa o currículo e faz simulado de entrevista."],
  ["Avisos da candidatura", "O sino mostra cada mudança de etapa e leva direto à página certa."],
  ["Mesma conta do site", "Tudo o que você faz no app aparece no site, e o contrário também."],
] as const;

export default function AppPage() {
  return (
    <>
      <PageHeader title="Nautiwork no celular" description="Instale em poucos segundos, sem loja de aplicativos e sem ocupar espaço: é o próprio site, com ícone e tela cheia." />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <section className="card" aria-labelledby="instalar"><h2 id="instalar" className="mb-3 font-display text-lg font-semibold">Instalar neste aparelho</h2><InstallApp variant="full" /></section>
        <ul className="grid gap-3 sm:grid-cols-2">{features.map(([t, d]) => (
          <li key={t} className="card"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-abyss/75">{d}</p></li>))}</ul>
        <p className="text-sm text-abyss/70">Está no computador? Aponte a câmera do celular para o <Link href="/qr" className="font-medium text-tide hover:underline">QR code do site</Link> e instale por lá. A versão para a Play Store e a App Store está em preparação.</p>
      </main>
    </>
  );
}
