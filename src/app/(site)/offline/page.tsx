import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sem conexão — Nautiwork", robots: { index: false } };

/** Mostrada pelo app instalado quando não há internet. */
export default function Offline() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Sem conexão</h1>
      <p className="mt-3 text-abyss/75">O Nautiwork precisa de internet para mostrar vagas e o seu painel. Confira o Wi-Fi ou os dados móveis e tente de novo.</p>
      {/* recarga completa de propósito: sem rede, a navegação do app não funciona */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="btn-primary mt-6">Tentar de novo</a>
    </main>
  );
}
