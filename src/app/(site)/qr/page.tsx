import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { qrSvg, qrTarget } from "@/lib/qr";
import { siteUrl } from "@/lib/app-url";

export const metadata: Metadata = { title: "QR code — Nautiwork", description: "QR code para abrir o Nautiwork pelo celular. Baixe em SVG ou PNG para imprimir.", alternates: { canonical: "/qr" } };

export default async function QrPage() {
  const svg = await qrSvg();
  const host = siteUrl().replace(/^https?:\/\//, "");
  return (
    <>
      <PageHeader title="QR code do site" description="Aponte a câmera do celular para abrir o Nautiwork. Serve para cartazes, a apresentação do TCC e materiais impressos." />
      <main className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 md:grid-cols-[minmax(0,420px)_1fr] md:py-12">
        <figure className="mx-auto w-full max-w-[420px]">
          <div className="rounded-panel bg-white p-4 shadow-[0_20px_50px_-20px_rgb(0_0_0/var(--shade-a))] [&_svg]:h-auto [&_svg]:w-full" role="img" aria-label={`QR code que abre ${host}`}
            dangerouslySetInnerHTML={{ __html: svg }} />
          <figcaption className="mt-3 text-center font-display text-lg font-semibold tracking-wide">{host}</figcaption>
        </figure>
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold">Baixar para imprimir</h2>
            <p className="mt-1 max-w-[60ch] text-sm text-abyss/70">O SVG não perde qualidade em nenhum tamanho e é o melhor para gráfica. O PNG tem 1024 pixels e serve para slides e redes sociais. Imprima com pelo menos 2 cm de lado e deixe a margem branca em volta.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/qr/nautiwork.svg" download className="btn-primary">Baixar SVG</a>
            <a href="/qr/nautiwork.png" download className="btn-ghost">Baixar PNG</a>
          </div>
          <p className="text-sm text-abyss/70">O código abre <span className="break-all font-medium text-abyss">{qrTarget()}</span>, a página inicial.</p>
        </div>
      </main>
    </>
  );
}
