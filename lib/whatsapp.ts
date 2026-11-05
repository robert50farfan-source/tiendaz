import type { Product } from "@/lib/types";

// Arma un link de wa.me a partir de un número en cualquier formato
// (admite espacios, guiones, "+", etc.) y un mensaje precargado.
export function buildWhatsappMessageLink(
  rawNumber: string | null | undefined,
  message: string
): string | null {
  if (!rawNumber) return null;
  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// Si se pasa productUrl, va al final del mensaje: WhatsApp arma con él una
// vista previa (foto, modelo y precio, desde los meta Open Graph de la ficha).
export function buildWhatsappLink(
  rawNumber: string | null | undefined,
  product: Pick<Product, "code" | "brand" | "model" | "status">,
  productUrl?: string | null
): string | null {
  let message =
    product.status === "reservado"
      ? `Hola, vi que el par ${product.code} está reservado. ¿Me avisan si se libera?`
      : `Hola, me interesa el par ${product.brand} ${product.model} (código ${product.code}). ¿Sigue disponible?`;
  if (productUrl) message += `\n${productUrl}`;
  return buildWhatsappMessageLink(rawNumber, message);
}
