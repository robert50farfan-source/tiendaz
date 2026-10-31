// Reduce una foto en el navegador antes de subirla: lado mayor a maxSize px y JPEG
// con la calidad más alta que quede bajo targetBytes. Fotos de celular de varios MB
// quedan en ~150-300 KB: cargan rápido y WhatsApp las muestra en la vista previa.
// Si el navegador no puede leer el formato (ej. HEIC en Chrome), sube el original.
const QUALITIES = [0.85, 0.75, 0.65, 0.55];

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function resizeImage(
  file: File,
  maxSize = 1600,
  targetBytes = 300 * 1024
): Promise<File> {
  // GIF se deja igual para no perder la animación.
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  // Fondo blanco: JPEG no tiene transparencia y un PNG quedaría con fondo negro.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob: Blob | null = null;
  for (const quality of QUALITIES) {
    blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= targetBytes) break;
  }

  // Si ya era chica y no hubo que achicarla, no vale la pena recomprimir.
  if (!blob || (scale === 1 && blob.size >= file.size)) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
