import { ImageResponse } from "next/og";

export const alt = "Nautiwork: ache a vaga que combina com o seu rumo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Prévia de link (WhatsApp, LinkedIn, Discord): título à esquerda, radar de vagas à direita.
export default function OpenGraphImage() {
  const blips = [
    { x: 250, y: 120, r: 16 }, { x: 150, y: 210, r: 13 }, { x: 330, y: 260, r: 18 },
    { x: 210, y: 330, r: 12 }, { x: 120, y: 300, r: 10 }, { x: 300, y: 150, r: 11 },
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#030A1A", color: "#E3EDFB", padding: "72px 80px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="21" stroke="#5CB8FF" strokeWidth="3" />
              <path d="M6 30c6-9 12-9 18-3s12 6 18-3" stroke="#5CB8FF" strokeWidth="3" strokeLinecap="round" />
              <path d="M12 38c5-6 10-6 14-2s8 3 12-1" stroke="#5CB8FF" strokeWidth="3" strokeLinecap="round" opacity=".7" />
              <path d="M13 22c3-8 12-12 19-7" stroke="#5CB8FF" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 30, letterSpacing: 6, fontWeight: 700 }}>NAUTIWORK</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>Ache a vaga que combina com o seu rumo.</div>
            <div style={{ fontSize: 30, color: "#A9BDD9", lineHeight: 1.35 }}>Veja o quanto cada vaga se aproxima das suas habilidades e acompanhe cada etapa da candidatura.</div>
          </div>
          <div style={{ fontSize: 24, color: "#5CB8FF" }}>nautiwork.vercel.app</div>
        </div>
        <div style={{ position: "absolute", right: 70, top: 115, width: 400, height: 400, display: "flex" }}>
          <svg width="400" height="400" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="196" fill="#071631" stroke="#1A3866" strokeWidth="3" />
            <circle cx="200" cy="200" r="147" fill="none" stroke="#5CB8FF" strokeOpacity=".18" strokeWidth="2" />
            <circle cx="200" cy="200" r="98" fill="none" stroke="#5CB8FF" strokeOpacity=".18" strokeWidth="2" />
            <circle cx="200" cy="200" r="49" fill="none" stroke="#5CB8FF" strokeOpacity=".18" strokeWidth="2" />
            <path d="M200 4v392M4 200h392" stroke="#5CB8FF" strokeOpacity=".12" strokeWidth="2" />
            <path d="M200 200 L396 200 A196 196 0 0 0 338.6 61.4 Z" fill="#5CB8FF" fillOpacity=".22" />
            <line x1="200" y1="200" x2="396" y2="200" stroke="#9CD3FF" strokeWidth="4" />
            {blips.map((b, i) => (
              <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="#3DE3C3" fillOpacity={i === 2 ? 1 : 0.75} stroke="#030A1A" strokeWidth="3" />
            ))}
            <circle cx="200" cy="200" r="7" fill="#5CB8FF" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
