/** Cabeçalho das páginas públicas: título, o que a página oferece e números reais do banco. */
export function PageHeader({ title, description, stats, children }: {
  title: string; description: string; stats?: [string, number][]; children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-mist/60">
      <svg className="pointer-events-none absolute -right-24 -top-28 h-[420px] w-[420px] text-tide" viewBox="0 0 420 420" aria-hidden="true">
        {[60, 110, 160, 205].map((r, i) => <circle key={r} cx="210" cy="210" r={r} fill="none" stroke="currentColor" strokeOpacity={0.14 - i * 0.03} />)}
      </svg>
      <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-7 sm:pb-9 sm:pt-11">
        <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-2 max-w-[60ch] text-base sm:mt-3 sm:text-lg leading-relaxed text-abyss/75">{description}</p>
        {stats && stats.length > 0 && (
          <dl className="mt-5 grid grid-cols-3 gap-x-4 gap-y-3 sm:mt-7 sm:flex sm:flex-wrap sm:gap-x-10 sm:gap-y-4">
            {stats.map(([label, value]) => (
              <div key={label}><dt className="text-xs leading-snug text-abyss/60 sm:text-sm">{label}</dt><dd className="tabular mt-0.5 font-display text-xl font-semibold sm:text-2xl">{value}</dd></div>
            ))}
          </dl>
        )}
        {children}
      </div>
    </section>
  );
}
