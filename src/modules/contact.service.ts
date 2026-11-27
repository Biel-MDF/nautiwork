// Contato e localização do candidato: WhatsApp (só aparece para empresas com autorização)
// e CEP (só para estimar o deslocamento; as coordenadas são aproximadas e não aparecem para ninguém).
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { contactSchema } from "@/lib/validators";
import { geocodeCep } from "./geo";

export async function updateContact(userId: string, raw: unknown, fetcher: typeof fetch = fetch) {
  const data = contactSchema.parse(raw);
  const p = await db.candidateProfile.findUnique({ where: { userId }, select: { id: true, postalCode: true, lat: true, lng: true } });
  if (!p) throw new HttpError(400, "Perfil de candidato não encontrado.");
  let place: { lat: number | null; lng: number | null; label?: string } = { lat: p.lat, lng: p.lng };
  if (data.postalCode !== p.postalCode) {
    if (!data.postalCode) place = { lat: null, lng: null };
    else {
      const g = await geocodeCep(data.postalCode, fetcher);
      place = g ? { lat: g.lat, lng: g.lng, label: g.label } : { lat: null, lng: null };
    }
  }
  await db.candidateProfile.update({ where: { id: p.id }, data: {
    postalCode: data.postalCode, lat: place.lat, lng: place.lng,
    whatsapp: data.whatsapp, whatsappOptIn: !!data.whatsapp && data.whatsappOptIn } });
  return { located: place.lat != null, label: place.label ?? null };
}

/** Link de conversa no WhatsApp (wa.me) com uma mensagem inicial. */
export function whatsappLink(number: string, text: string) {
  const digits = number.replace(/\D/g, "");
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}
