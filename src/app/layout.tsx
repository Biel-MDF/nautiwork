import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import "./globals.css";

const display = Sora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

const description = "Veja o quanto cada vaga se aproxima das suas habilidades, candidate-se com um perfil só e acompanhe cada etapa da candidatura.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://nautiwork.vercel.app"),
  title: { default: "Nautiwork — vagas e candidaturas num só lugar", template: "%s" },
  description,
  applicationName: "Nautiwork",
  openGraph: { type: "website", locale: "pt_BR", siteName: "Nautiwork", title: "Nautiwork — ache a vaga que combina com o seu rumo", description },
  twitter: { card: "summary_large_image", title: "Nautiwork — ache a vaga que combina com o seu rumo", description },
};

export const viewport = { themeColor: "#030A1A", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
