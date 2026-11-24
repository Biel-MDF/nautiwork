import { Navbar } from "./Navbar";

/** Moldura das telas de acesso: painel centralizado sobre os anéis do sonar. */
export async function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="relative isolate flex min-h-[calc(100vh-69px)] items-start justify-center overflow-hidden px-4 py-12 sm:items-center">
        <svg className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2" viewBox="0 0 900 900" aria-hidden="true">
          {[120, 220, 320, 420].map((r, i) => <circle key={r} cx="450" cy="450" r={r} fill="none" stroke="#5CB8FF" strokeOpacity={0.1 - i * 0.02} />)}
        </svg>
        <div className="card w-full max-w-[420px] p-7 sm:p-9">{children}</div>
      </main>
    </>
  );
}
