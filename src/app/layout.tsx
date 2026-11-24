import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import "./globals.css";

const display = Sora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Nautiwork — vagas e candidaturas num só lugar",
  description: "Plataforma de empregabilidade que conecta candidatos e empresas.",
};

export const viewport = { themeColor: "#030A1A", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
