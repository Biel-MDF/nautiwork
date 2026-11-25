import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { invalidatePublic } from "@/lib/cache";

export const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type ImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/**
 * Identifica o formato pelos primeiros bytes do arquivo, não pela extensão nem pelo
 * Content-Type enviado pelo navegador (ambos podem ser forjados). SVG fica de fora
 * porque pode carregar script.
 */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export function validateImage(bytes: Uint8Array): ImageType {
  if (bytes.length === 0) throw new HttpError(400, "Selecione um arquivo de imagem.");
  if (bytes.length > MAX_IMAGE_BYTES) throw new HttpError(413, "A imagem deve ter no máximo 1 MB.");
  const type = sniffImageType(bytes);
  if (!type) throw new HttpError(415, "Formato não aceito. Envie PNG, JPEG ou WebP.");
  return type;
}

export async function saveUserImage(userId: string, bytes: Uint8Array) {
  const mimeType = validateImage(bytes);
  const data = Buffer.from(bytes);
  await db.userImage.upsert({
    where: { userId },
    create: { userId, data, mimeType, size: bytes.length },
    update: { data, mimeType, size: bytes.length },
  });
  invalidatePublic(); // logotipos aparecem nas páginas públicas
  return { ok: true, mimeType, size: bytes.length };
}

export async function deleteUserImage(userId: string) {
  await db.userImage.deleteMany({ where: { userId } });
  invalidatePublic();
  return { ok: true };
}

/**
 * Logotipo de empresa ativa é público. Foto de candidato só é vista pelo próprio
 * candidato, por administradores e por empresas que receberam candidatura dele.
 */
export async function canViewImage(ownerId: string, viewer: { id: string; role: string } | null) {
  const owner = await db.user.findUnique({ where: { id: ownerId }, select: { role: true, active: true } });
  if (!owner) return false;
  if (viewer?.role === "ADMIN" || viewer?.id === ownerId) return true;
  if (!owner.active) return false;
  if (owner.role === "COMPANY") return true;
  if (owner.role === "CANDIDATE" && viewer?.role === "COMPANY") {
    const link = await db.jobApplication.findFirst({
      where: { candidate: { userId: ownerId }, job: { company: { userId: viewer.id } } }, select: { id: true },
    });
    return !!link;
  }
  return false;
}
