// Marca do Imperador (o administrador maior): coroa dourada e selo. As cores ficam em globals.css
// (.imp-*), com uma versão mais escura no tema claro para manter o contraste.

export function Crown({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M3.5 8.2 8 11.6l4-6.1 4 6.1 4.5-3.4-1.7 9.4H5.2L3.5 8.2Z" fill="currentColor" />
      <path d="M5.2 19.4h13.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="3.5" cy="7.6" r="1.4" fill="currentColor" /><circle cx="12" cy="4.6" r="1.5" fill="currentColor" /><circle cx="20.5" cy="7.6" r="1.4" fill="currentColor" />
    </svg>
  );
}

/** Selo "Imperador" (ou o texto que vier), com a coroa. */
export function EmperorBadge({ label = "Imperador", className = "" }: { label?: string; className?: string }) {
  return <span className={`imp-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}><Crown size={13} />{label}</span>;
}
