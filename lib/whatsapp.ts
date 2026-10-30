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

export function buildWhatsappLink(
  rawNumber: string | null | undefined,
  product: Pick<Product, "code" | "brand" | "model">
): string | null {
  const message = `Hola, me interesa el par ${product.brand} ${product.model} (código ${product.code}). ¿Sigue disponible?`;
  return buildWhatsappMessageLink(rawNumber, message);
}
