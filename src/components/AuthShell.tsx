import Link from "next/link";
import { Logo } from "./Logo";
import { SonarConsole } from "./SonarConsole";

/**
 * Moldura das telas de acesso (login, cadastro, senha, confirmação de e-mail):
 * página inteira, logo no topo, título grande, conteúdo centralizado,
 * console de sonar no canto e aviso de privacidade no rodapé.
 */
export function AuthShell({ title, subtitle, notice, children }: {
  title: string; subtitle?: React.ReactNode; notice?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      {/* fundo: linhas de profundidade e anéis do sonar saindo do console, no canto inferior direito */}
      <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="access-glow" cx="80%" cy="82%" r="55%">
            <stop offset="0" stopColor="#1B4F96" stopOpacity=".28" />
            <stop offset="1" stopColor="#030A1A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#access-glow)" />
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M0 ${420 + i * 58} C 260 ${360 + i * 58}, 520 ${520 + i * 52}, 780 ${450 + i * 54} S 1200 ${380 + i * 58}, 1440 ${470 + i * 56}`}
            fill="none" stroke="#5CB8FF" strokeOpacity={0.075 - i * 0.006} />
        ))}
        {[140, 260, 380, 500, 620].map((r, i) => (
          <circle key={r} cx="1170" cy="740" r={r} fill="none" stroke="#5CB8FF" strokeOpacity={0.11 - i * 0.018} strokeDasharray={i % 2 ? "2 7" : undefined} />
        ))}
      </svg>

      <header className="px-5 pt-5 sm:px-10 sm:pt-8">
        <Link href="/" aria-label="Nautiwork, voltar à página inicial" className="inline-flex"><Logo /></Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-5 pb-10 pt-12 sm:pt-16 lg:pt-14">
        <h1 className="text-center text-[38px] font-semibold leading-[1.1] sm:text-5xl lg:text-[56px]">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-[52ch] text-center text-abyss/70">{subtitle}</p>}
        <div className="mt-8 w-full max-w-[420px]">{children}</div>
      </main>

      <SonarConsole className="pointer-events-none mx-auto -mt-2 mb-6 w-[200px] sm:w-[240px] lg:absolute lg:bottom-24 lg:right-[4%] lg:-z-10 lg:m-0 lg:w-[300px] xl:right-[8%] xl:w-[340px]" />

      <aside className="mx-5 mb-6 flex overflow-hidden rounded-panel border border-mist bg-casco/80 backdrop-blur sm:mx-10 sm:mb-8 lg:mr-[calc(4%+320px)] xl:mr-[calc(8%+360px)]">
        <div className="flex shrink-0 items-start border-r border-mist px-4 py-5 text-tide sm:px-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="px-4 py-4 text-sm leading-relaxed text-abyss/80 sm:px-6 sm:text-[15px]">
          {notice ?? <>Sua senha é guardada com criptografia e trocá-la encerra todas as sessões abertas. Você pode baixar ou apagar seus dados a qualquer momento em Configurações.</>}{" "}
          <Link href="/privacidade" className="font-medium text-tide underline underline-offset-2 hover:text-deep">Política de Privacidade</Link>
        </p>
      </aside>
    </div>
  );
}

/** Divisor "ou" com uma ação secundária embaixo (ex.: criar conta, entrar). */
export function AuthAlternative({ href, label, hint }: { href: string; label: string; hint?: string }) {
  return (
    <>
      <div className="my-7 flex items-center gap-4 text-sm text-abyss/55" aria-hidden="true">
        <span className="h-px flex-1 bg-mist" />ou<span className="h-px flex-1 bg-mist" />
      </div>
      <Link href={href} className="btn-ghost min-h-[52px] w-full text-base">{label}</Link>
      {hint && <p className="mt-3 text-center text-sm text-abyss/60">{hint}</p>}
    </>
  );
}
