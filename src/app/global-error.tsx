"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

// Último recurso: quando até o layout principal falha. Substitui <html> inteiro.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-fossa text-abyss">
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">O Nautiwork teve um problema</h1>
          <p className="mt-2 text-abyss/80">A equipe já foi avisada. Tente recarregar a página em alguns instantes.</p>
          <button className="btn-primary mt-6" onClick={reset}>Tentar de novo</button>
        </main>
      </body>
    </html>
  );
}
