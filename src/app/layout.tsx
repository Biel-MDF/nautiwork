import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import "./globals.css";
import { currentUser, viewMode } from "@/lib/rbac";
import { ViewModeBar } from "@/components/ViewMode";
import { splitDemo } from "@/lib/display";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Modo de visualização do admin: barra fixa avisando e permitindo voltar.
  const mode = await viewMode();
  const as = mode && mode !== "visitor" ? await currentUser() : null;
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className={mode ? "pb-28" : undefined}>
        {children}
        {mode && <ViewModeBar mode={mode} as={as ? `${splitDemo(as.name).name}, conta de demonstração` : null} />}
      </body>
    </html>
  );
}
