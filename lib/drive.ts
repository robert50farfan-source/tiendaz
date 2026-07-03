// Convierte un link de "compartir" de Google Drive en una URL de imagen directa.
// Solo funciona si el archivo está compartido como "Cualquiera con el enlace".
export function driveThumbnailUrl(url: string | null, size = 800): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([^/]+)/);
  if (!match) return url;
  return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${size}`;
}
