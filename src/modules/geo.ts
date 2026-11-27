// Estimativa de deslocamento: CEP → coordenadas aproximadas → distância em linha reta →
// minutos de transporte público. É uma estimativa grosseira e o site diz isso; serve para
// separar "perto" de "do outro lado da cidade", não para planejar o trajeto.

export const normalizeCep = (s: string) => s.replace(/\D/g, "").slice(0, 8);

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Ruas não são retas: 1,3 × a distância; ônibus e metrô a ~18 km/h na média; 10 min de caminhada e espera. */
export const TRANSIT = { detour: 1.3, kmh: 18, fixedMin: 10 };
export function transitMinutes(km: number) {
  return Math.round(TRANSIT.fixedMin + ((km * TRANSIT.detour) / TRANSIT.kmh) * 60);
}
/** Raio em km que cabe em tantos minutos (inverso de transitMinutes), para filtrar no banco. */
export function kmForMinutes(min: number) {
  return Math.max(0, ((min - TRANSIT.fixedMin) / 60) * TRANSIT.kmh / TRANSIT.detour);
}

export function commuteFor(home: { lat: number | null; lng: number | null } | null, job: { lat: number | null; lng: number | null; workMode: string }) {
  if (!home || home.lat == null || home.lng == null || job.lat == null || job.lng == null || job.workMode === "REMOTE") return null;
  const km = haversineKm({ lat: home.lat, lng: home.lng }, { lat: job.lat, lng: job.lng });
  if (km > 150) return { km: Math.round(km), minutes: null };
  return { km: Math.round(km * 10) / 10, minutes: transitMinutes(km) };
}

type Coords = { lat: number; lng: number; label: string };

/** CEP → coordenadas. Tenta a BrasilAPI; se ela não tiver coordenadas, procura o endereço no OpenStreetMap. */
export async function geocodeCep(cepRaw: string, fetcher: typeof fetch = fetch): Promise<Coords | null> {
  const cep = normalizeCep(cepRaw);
  if (cep.length !== 8) return null;
  try {
    const r = await fetcher(`https://brasilapi.com.br/api/cep/v2/${cep}`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const j = await r.json() as { street?: string; neighborhood?: string; city?: string; state?: string; location?: { coordinates?: { latitude?: string | number; longitude?: string | number } } };
    const label = [j.neighborhood, j.city, j.state].filter(Boolean).join(", ");
    const lat = Number(j.location?.coordinates?.latitude), lng = Number(j.location?.coordinates?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0) return { lat, lng, label };
    const q = [j.street, j.neighborhood, j.city, j.state, "Brasil"].filter(Boolean).join(", ");
    const n = await fetcher(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`, {
      signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Nautiwork/1.0 (TCC; nautiwork.vercel.app)", "Accept-Language": "pt-BR" },
    });
    if (!n.ok) return null;
    const [hit] = await n.json() as { lat: string; lon: string }[];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), label } : null;
  } catch {
    return null;
  }
}
