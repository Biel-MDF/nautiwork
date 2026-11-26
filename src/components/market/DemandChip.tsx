/** Selo da demanda de uma área do mercado. */
export function DemandChip({ value }: { value: string }) {
  const tone = value === "Muito alta" ? "border-reef/50 bg-reef/10 text-reef" : value === "Alta" ? "border-tide/50 bg-tide/10 text-deep"
    : value === "Em mudança" ? "border-coral/40 bg-coral/10 text-coral" : "border-mist bg-foam text-abyss/80";
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{value}</span>;
}
