"use client";
export default function Error({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-bold">Algo deu errado</h1><p className="mt-2">Não conseguimos carregar esta página. Tente novamente.</p><button className="btn-primary mt-6" onClick={reset}>Tentar de novo</button></main>;
}
