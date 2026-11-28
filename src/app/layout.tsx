import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import "./globals.css";
import { ViewModeGate } from "@/components/NavAccount";
import { Assistant } from "@/components/assistant/Assistant";
import { assistantEnabled } from "@/modules/assistant/config";
import { NavHistory } from "@/components/BackButton";
import { PwaRegister } from "@/components/InstallApp";
import { themeBootScript, themeCss } from "@/lib/themes";
import { uiBootScript } from "@/lib/ui-prefs";

const display = Sora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

const description = "Veja o quanto cada vaga se aproxima das suas habilidades, candidate-se com um perfil só e acompanhe cada etapa da candidatura.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://nautiwork.vercel.app"),
  title: { default: "Nautiwork — vagas e candidaturas num só lugar", template: "%s" },
  description,
  applicationName: "Nautiwork",
  // iPhone: "Adicionar à Tela de Início" abre em tela cheia, com o nome curto
  appleWebApp: { capable: true, title: "Nautiwork", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: { type: "website", locale: "pt_BR", siteName: "Nautiwork", title: "Nautiwork — ache a vaga que combina com o seu rumo", description },
  twitter: { card: "summary_large_image", title: "Nautiwork — ache a vaga que combina com o seu rumo", description },
};

export const viewport = { themeColor: "#030A1A", viewportFit: "cover" as const };

const css = themeCss();
const boot = themeBootScript() + uiBootScript();

// Não lê cookies nem sessão: páginas sem dados pessoais ficam estáticas. A conta, a barra do
// modo de visualização e as rotinas de validade das vagas vêm de /api/me, chamado no navegador.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o script abaixo marca paleta e modo no <html> antes do React assumir.
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        <NavHistory />
        {children}
        {assistantEnabled() && <Assistant raised={false} />}
        <PwaRegister />
        <ViewModeGate />
      </body>
    </html>
  );
}
