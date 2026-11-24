import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        {/* sonar sem nenhum contato */}
        <svg width="132" height="132" viewBox="0 0 132 132" fill="none" aria-hidden="true" className="text-tide">
          {[62, 44, 26].map((r, i) => <circle key={r} cx="66" cy="66" r={r} stroke="currentColor" strokeOpacity={0.18 + i * 0.12} />)}
          <path d="M66 4v124M4 66h124" stroke="currentColor" strokeOpacity=".12" />
          <circle cx="66" cy="66" r="4" fill="currentColor" />
        </svg>
        <h1 className="mt-8 text-3xl font-semibold sm:text-4xl">Página não encontrada</h1>
        <p className="mt-3 max-w-[42ch] leading-relaxed text-abyss/75">O endereço não existe ou foi removido. Confira o link ou siga para as vagas abertas.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/jobs" className="btn-primary">Ver vagas abertas</Link>
          <Link href="/" className="btn-ghost">Ir para o início</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
