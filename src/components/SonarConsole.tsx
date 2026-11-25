/**
 * Ilustração da tela de login: um console de sonar em perspectiva isométrica.
 * A tela de cima é um círculo achatado (escala 1 x 0,5), por isso o feixe gira num plano "deitado".
 * Puramente decorativa: aria-hidden, e com movimento reduzido fica parada.
 */
export function SonarConsole({ className = "" }: { className?: string }) {
  // Face de cima: losango centrado em (180,150). Altura do console: 84.
  const H = 84;
  return (
    <svg viewBox="0 0 360 330" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sc-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--c-foam))" />
          <stop offset="1" stopColor="rgb(var(--c-casco))" />
        </linearGradient>
        <linearGradient id="sc-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="color-mix(in srgb, rgb(var(--c-foam)) 70%, rgb(var(--c-mist)))" />
          <stop offset="1" stopColor="rgb(var(--c-casco))" />
        </linearGradient>
        <radialGradient id="sc-screen" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="rgb(var(--c-foam))" />
          <stop offset="1" stopColor="rgb(var(--c-fossa))" />
        </radialGradient>
        <linearGradient id="sc-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgb(var(--c-deep))" stopOpacity=".9" />
          <stop offset="1" stopColor="rgb(var(--c-tide))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* sombra no fundo do mar */}
      <ellipse cx="180" cy="300" rx="150" ry="24" fill="rgb(var(--c-tide))" opacity=".07" />

      {/* pulsos de som subindo da tela */}
      <g fill="none" stroke="rgb(var(--c-tide))" strokeLinecap="round">
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${120 - i * 22} ${92 - i * 26} Q180 ${60 - i * 34} ${240 + i * 22} ${92 - i * 26}`}
            strokeWidth="2" className="motion-safe:animate-ping-wave" style={{ animationDelay: `${i * 0.5}s`, opacity: 0.55 - i * 0.15 }} />
        ))}
      </g>

      {/* corpo: face esquerda, face direita, tampo */}
      <path d={`M60 150 L180 210 L180 ${210 + H} L60 ${150 + H} Z`} fill="url(#sc-left)" stroke="rgb(var(--c-line))" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={`M180 210 L300 150 L300 ${150 + H} L180 ${210 + H} Z`} fill="url(#sc-right)" stroke="rgb(var(--c-line))" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M60 150 L180 90 L300 150 L180 210 Z" fill="rgb(var(--c-foam))" stroke="rgb(var(--c-tide))" strokeOpacity=".55" strokeWidth="1.5" strokeLinejoin="round" />

      {/* grade de ventilação na face esquerda */}
      <g stroke="rgb(var(--c-tide))" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round">
        {[0, 1, 2, 3, 4].map((k) => <line key={k} x1="76" y1={178 + k * 11} x2="164" y2={222 + k * 11} />)}
      </g>

      {/* luzes de estado na face direita */}
      <g>
        <ellipse cx="200" cy="232" rx="4.5" ry="3.5" fill="rgb(var(--c-reef))" className="motion-safe:animate-blink" />
        <ellipse cx="214" cy="225" rx="4.5" ry="3.5" fill="rgb(var(--c-tide))" opacity=".85" />
        <ellipse cx="228" cy="218" rx="4.5" ry="3.5" fill="rgb(var(--c-coral))" opacity=".75" />
        <path d="M200 258 L284 216" stroke="rgb(var(--c-tide))" strokeOpacity=".25" strokeWidth="6" strokeLinecap="round" />
        <path d="M200 272 L252 246" stroke="rgb(var(--c-tide))" strokeOpacity=".15" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* tela do sonar, deitada sobre o tampo */}
      <g transform="translate(180 150) scale(1 0.5)">
        <circle r="96" fill="url(#sc-screen)" stroke="rgb(var(--c-tide))" strokeOpacity=".7" strokeWidth="2.5" />
        {[32, 64].map((r) => <circle key={r} r={r} fill="none" stroke="rgb(var(--c-tide))" strokeOpacity=".22" strokeWidth="1.5" />)}
        <path d="M-96 0H96M0 -96V96" stroke="rgb(var(--c-tide))" strokeOpacity=".14" strokeWidth="1.5" />
        <g className="motion-safe:animate-radar" style={{ transformOrigin: "0 0" }}>
          <path d="M0 0 L96 0 A96 96 0 0 0 67.9 -67.9 Z" fill="url(#sc-beam)" opacity=".55" />
          <line x1="0" y1="0" x2="96" y2="0" stroke="rgb(var(--c-deep))" strokeWidth="2.5" />
        </g>
        {/* contatos */}
        <circle cx="-40" cy="-30" r="6" fill="rgb(var(--c-reef))" className="motion-safe:animate-blink" />
        <circle cx="52" cy="38" r="5" fill="rgb(var(--c-reef))" opacity=".8" className="motion-safe:animate-blink" style={{ animationDelay: "1.1s" }} />
        <circle cx="18" cy="-70" r="4" fill="rgb(var(--c-reef))" opacity=".6" className="motion-safe:animate-blink" style={{ animationDelay: "2.2s" }} />
        <circle r="5" fill="rgb(var(--c-tide))" />
      </g>

      {/* bolhas */}
      <g fill="none" stroke="rgb(var(--c-deep))" strokeOpacity=".35" strokeWidth="1.5">
        <circle cx="318" cy="108" r="6" />
        <circle cx="332" cy="80" r="3.5" />
        <circle cx="40" cy="118" r="4.5" />
      </g>
    </svg>
  );
}
