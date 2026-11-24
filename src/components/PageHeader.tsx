/** Cabeçalho das páginas públicas: título, o que a página oferece e números reais do banco. */
export function PageHeader({ title, description, stats, children }: {
  title: string; description: string; stats?: [string, number][]; children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-mist/60">
      <svg className="pointer-events-none absolute -right-24 -top-28 h-[420px] w-[420px] text-tide" viewBox="0 0 420 420" aria-hidden="true">
        {[60, 110, 160, 205].map((r, i) => <circle key={r} cx="210" cy="210" r={r} fill="none" stroke="currentColor" strokeOpacity={0.14 - i * 0.03} />)}
      </svg>
      <div className="relative mx-auto max-w-6xl px-4 pb-9 pt-11">
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-abyss/75">{description}</p>
        {stats && stats.length > 0 && (
          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map(([label, value]) => (
              <div key={label}><dt className="text-sm text-abyss/60">{label}</dt><dd className="tabular mt-0.5 font-display text-2xl font-semibold">{value}</dd></div>
            ))}
          </dl>
        )}
        {children}
      </div>
    </section>
  );
}
