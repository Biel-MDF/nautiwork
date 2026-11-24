import Link from "next/link";

type Contact = { id: string; title: string; company: string; publishedAt: Date };

const SWEEP_MS = 2600;

/**
 * Sonar da página inicial: cada ponto é uma vaga ativa. Distância do centro = idade da vaga
 * (mais perto, mais recente); o ângulo só distribui os pontos. O feixe dá uma volta ao carregar
 * e cada ponto acende quando ele passa. Com movimento reduzido, tudo aparece parado e aceso.
 */
export function Sonar({ contacts, total }: { contacts: Contact[]; total: number }) {
  const now = Date.now();
  const ages = contacts.map((c) => (now - c.publishedAt.getTime()) / 86_400_000);
  const maxAge = Math.max(1, ...ages);
  const points = contacts.map((c, i) => {
    const angle = (i * 137.508 + 24) % 360; // ângulo áureo: espalha sem amontoar
    const radius = 18 + (ages[i] / maxAge) * 26; // % do raio útil (18% a 44%)
    const rad = ((angle - 90) * Math.PI) / 180;
    return { ...c, angle, x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
  });

  return (
    <figure className="mx-auto w-full max-w-[440px]">
      <div className="relative aspect-square">
        {/* mostrador: anéis de distância, rumos e marcas de grau */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <radialGradient id="sonar-floor" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0B2A57" stopOpacity=".9" />
              <stop offset="100%" stopColor="#040E22" stopOpacity="1" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="196" fill="url(#sonar-floor)" stroke="#1A3866" strokeWidth="1.5" />
          {[49, 98, 147].map((r) => <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#5CB8FF" strokeOpacity=".16" />)}
          <path d="M200 8v384M8 200h384" stroke="#5CB8FF" strokeOpacity=".12" />
          {Array.from({ length: 72 }).map((_, i) => {
            const long = i % 9 === 0;
            const a = (i * 5 * Math.PI) / 180;
            const r1 = long ? 182 : 188;
            return <line key={i} x1={200 + r1 * Math.sin(a)} y1={200 - r1 * Math.cos(a)} x2={200 + 194 * Math.sin(a)} y2={200 - 194 * Math.cos(a)}
              stroke="#5CB8FF" strokeOpacity={long ? 0.5 : 0.2} strokeWidth={long ? 1.5 : 1} />;
          })}
          <circle cx="200" cy="200" r="4" fill="#5CB8FF" />
        </svg>

        {/* feixe: dá uma volta e para no rumo inicial */}
        <div className="pointer-events-none absolute inset-[2%] rounded-full motion-safe:animate-sweep"
          style={{ background: "conic-gradient(from 0deg, transparent 0deg, transparent 290deg, rgba(92,184,255,0.05) 315deg, rgba(92,184,255,0.32) 359deg, rgba(156,211,255,0.85) 360deg)" }}
          aria-hidden="true" />

        {/* contatos: cada um é uma vaga real */}
        <ul>
          {points.map((p) => (
            <li key={p.id} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <Link href={`/jobs/${p.id}`} aria-label={`${p.title}, ${p.company}`}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-2.5 focus-visible:outline-offset-0">
                <span className="block h-3 w-3 rounded-full bg-reef shadow-[0_0_0_4px_rgba(61,227,195,0.18),0_0_18px_rgba(61,227,195,0.65)] motion-safe:animate-contact"
                  style={{ animationDelay: `${Math.round((p.angle / 360) * SWEEP_MS)}ms` }} />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden w-max max-w-[220px] -translate-x-1/2 rounded-control border border-mist bg-casco px-3 py-2 text-left text-xs shadow-lg group-hover:block group-focus-visible:block">
                  <span className="block font-semibold text-abyss">{p.title}</span>
                  <span className="block text-abyss/70">{p.company}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-4 text-center text-sm text-abyss/70">
        <span className="tabular font-semibold text-abyss">{total}</span> {total === 1 ? "vaga aberta" : "vagas abertas"} agora.
        Quanto mais perto do centro, mais recente. Toque, passe o mouse ou use Tab para ver cada vaga.
      </figcaption>
    </figure>
  );
}
