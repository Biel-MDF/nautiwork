import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/errors";
import { canViewImage } from "@/modules/images";

export const GET = handle(async (_req: Request, { params }: { params: Promise<{ userId: string }> }) => {
  const session = await auth();
  const viewer = session?.user ? { id: session.user.id, role: session.user.role } : null;
  // Sem permissão responde 404, para não revelar se a pessoa tem foto.
  if (!(await canViewImage((await params).userId, viewer))) throw new HttpError(404, "Imagem não encontrada.");
  const img = await db.userImage.findUnique({ where: { userId: (await params).userId } });
  if (!img) throw new HttpError(404, "Imagem não encontrada.");
  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mimeType,
      "Content-Length": String(img.size),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
});
