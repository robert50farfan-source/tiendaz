// Convierte un link de "compartir" de Google Drive en una URL de imagen directa.
// Solo funciona si el archivo está compartido como "Cualquiera con el enlace".
export function driveThumbnailUrl(url: string | null, size = 800): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([^/]+)/);
  if (!match) return url;
  return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${size}`;
}

import type { Product } from "@/lib/types";

// Lista de imágenes de un producto: usa la galería (image_urls) y si está
// vacía cae al campo legado image_url (productos migrados antes de la galería).
export function productImageList(
  product: Pick<Product, "image_url" | "image_urls">,
  size = 800
): string[] {
  const urls =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [];
  return urls
    .map((u) => driveThumbnailUrl(u, size))
    .filter((u): u is string => Boolean(u));
}
