import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { deleteUserImage, MAX_IMAGE_BYTES, saveUserImage } from "@/modules/images";

// Envio em multipart/form-data, campo "file". Foto (candidato) ou logotipo (empresa).
export const POST = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY");
  // Recusa cedo pelo cabeçalho, antes de ler o corpo inteiro na memória.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_IMAGE_BYTES + 64 * 1024) throw new HttpError(413, "A imagem deve ter no máximo 1 MB.");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) throw new HttpError(400, "Selecione um arquivo de imagem.");
  if (file.size > MAX_IMAGE_BYTES) throw new HttpError(413, "A imagem deve ter no máximo 1 MB.");
  return NextResponse.json(await saveUserImage(userId, new Uint8Array(await file.arrayBuffer())), { status: 201 });
});

export const DELETE = handle(async () => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY");
  return NextResponse.json(await deleteUserImage(userId));
});
