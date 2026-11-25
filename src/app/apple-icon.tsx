import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ícone da tela inicial do iPhone/iPad: o mesmo símbolo do site, sobre fundo escuro.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#071631" }}>
        <svg width="132" height="132" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="21" stroke="#5CB8FF" strokeWidth="3" />
          <path d="M6 30c6-9 12-9 18-3s12 6 18-3" stroke="#5CB8FF" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 38c5-6 10-6 14-2s8 3 12-1" stroke="#5CB8FF" strokeWidth="3" strokeLinecap="round" opacity=".7" />
          <path d="M13 22c3-8 12-12 19-7" stroke="#5CB8FF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
