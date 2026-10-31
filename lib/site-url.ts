import { headers } from "next/headers";

// URL pública del sitio (ej. "https://tienda.com"), para armar links absolutos.
// SITE_URL tiene prioridad; si no está, se deduce del request. Detrás de un proxy,
// éste debe reenviar x-forwarded-host/x-forwarded-proto, o conviene definir SITE_URL.
export async function getSiteUrl(): Promise<string | null> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
