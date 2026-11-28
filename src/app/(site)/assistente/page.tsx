import type { Metadata } from "next";
import { Suspense } from "react";
import { AssistantPage } from "@/components/assistant/AssistantPage";

export const metadata: Metadata = {
  title: "Assistente com IA — Nautiwork",
  description: "Assistente de vagas e carreira, revisão de currículo, simulado de entrevista e ajuda para empresas escreverem vagas e compararem candidatos.",
  alternates: { canonical: "/assistente" },
};

// Página estática: quem está conversando e o modo são lidos no navegador.
export default function Assistente() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-semibold sm:text-3xl">Assistente com IA</h1>
      <p className="mt-1 max-w-[65ch] text-sm text-abyss/75">Escolha o que quer fazer. As respostas usam os dados do Nautiwork e podem ter erros: confira na página da vaga.</p>
      <Suspense fallback={<div className="card mt-5 h-[60vh]" aria-busy="true" />}><AssistantPage /></Suspense>
    </main>
  );
}
