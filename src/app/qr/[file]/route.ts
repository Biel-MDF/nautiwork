import { qrPng, qrSvg } from "@/lib/qr";

type Ctx = { params: Promise<{ file: string }> };

/** /qr/nautiwork.svg e /qr/nautiwork.png: o QR code para baixar e imprimir. */
export async function GET(_req: Request, { params }: Ctx) {
  const { file } = await params;
  const headers = { "Cache-Control": "public, max-age=3600", "Content-Disposition": `inline; filename="${file}"` };
  if (file === "nautiwork.svg") return new Response(await qrSvg(), { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  if (file === "nautiwork.png") return new Response(new Uint8Array(await qrPng()), { headers: { ...headers, "Content-Type": "image/png" } });
  return new Response("Não encontrado", { status: 404 });
}
