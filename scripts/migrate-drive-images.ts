// Copia las fotos que siguen en Google Drive al bucket "product-images" de Supabase
// y reemplaza los links en image_urls / image_url. Seguro de re-ejecutar: el nombre
// del archivo se deriva del id de Drive y se sube con upsert.
// Uso:
//   npx tsx scripts/migrate-drive-images.ts          (prueba: solo descarga y reporta)
//   npx tsx scripts/migrate-drive-images.ts --apply  (sube y actualiza los productos)
// Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY

import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const BUCKET = "product-images";
// Ancho de la versión que se descarga de Drive: suficiente para la galería (1200px)
// sin bajar originales de varios MB.
const DOWNLOAD_WIDTH = 1600;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function driveFileId(url: string): string | null {
  if (!url.includes("drive.google.com")) return null;
  return url.match(/\/d\/([^/]+)/)?.[1] ?? url.match(/[?&]id=([^&]+)/)?.[1] ?? null;
}

async function download(fileId: string): Promise<{ body: ArrayBuffer; type: string }> {
  const res = await fetch(
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w${DOWNLOAD_WIDTH}`
  );
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) {
    throw new Error(`HTTP ${res.status} (${type || "sin tipo"}); ¿está compartido como "Cualquiera con el enlace"?`);
  }
  return { body: await res.arrayBuffer(), type };
}

// Sube (o reutiliza si ya se subió en esta corrida) y devuelve la URL pública.
const migrated = new Map<string, string>();
async function migrate(fileId: string): Promise<string> {
  const cached = migrated.get(fileId);
  if (cached) return cached;

  const { body, type } = await download(fileId);
  const ext = type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const objectPath = `drive-${fileId}.${ext}`;

  if (APPLY) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, body, { contentType: type, upsert: true });
    if (error) throw new Error(`al subir: ${error.message}`);
  }

  const url = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
  console.log(`  ok ${fileId} (${Math.round(body.byteLength / 1024)} KB)`);
  migrated.set(fileId, url);
  return url;
}

async function main() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, code, image_url, image_urls")
    .order("code");

  if (error) {
    console.error("Error al leer productos:", error.message);
    process.exit(1);
  }

  const pending = (products ?? []).filter((p) =>
    [p.image_url, ...(p.image_urls ?? [])].some((u) => u && driveFileId(u))
  );

  console.log(
    `${APPLY ? "MIGRANDO" : "PRUEBA (sin cambios)"}: ${pending.length} de ${products?.length ?? 0} productos con fotos en Drive\n`
  );

  let failed = 0;
  for (const p of pending) {
    console.log(p.code);
    try {
      const replace = async (u: string) => {
        const id = driveFileId(u);
        return id ? migrate(id) : u;
      };

      const gallery: string[] =
        p.image_urls && p.image_urls.length > 0
          ? p.image_urls
          : p.image_url
            ? [p.image_url]
            : [];
      const newGallery = [];
      for (const u of gallery) newGallery.push(await replace(u));
      const newImageUrl = p.image_url ? await replace(p.image_url) : null;

      if (APPLY) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ image_urls: newGallery, image_url: newImageUrl })
          .eq("id", p.id);
        if (updateError) throw new Error(`al actualizar: ${updateError.message}`);
      }
    } catch (e) {
      failed++;
      console.error(`  ERROR ${p.code}: ${(e as Error).message}`);
    }
  }

  console.log(
    `\nListo. ${pending.length - failed} correctos, ${failed} con error.` +
      (APPLY ? "" : " Ejecuta con --apply para aplicar los cambios.")
  );
}

main();
