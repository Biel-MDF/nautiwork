export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className="text-tide">
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="3" />
      <path d="M6 30c6-9 12-9 18-3s12 6 18-3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 38c5-6 10-6 14-2s8 3 12-1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <path d="M13 22c3-8 12-12 19-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
/** compact: em telas abaixo de 360px mostra só o símbolo (usado na barra de navegação). */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 sm:gap-2.5">
      <LogoMark />
      <span className={`font-display text-[15px] font-semibold tracking-[0.06em] text-abyss sm:text-[17px] sm:tracking-[0.14em] ${compact ? "hidden min-[360px]:inline" : ""}`}>NAUTIWORK</span>
    </span>
  );
}
