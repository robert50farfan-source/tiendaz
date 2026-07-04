// Rellena image_urls (galería) con el image_url legado, solo para productos
// que aún no tengan ninguna foto en la galería. Uso único, seguro de re-ejecutar.
// Uso: npx tsx scripts/backfill-image-urls.ts

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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, image_url, image_urls")
    .not("image_url", "is", null);

  if (error) {
    console.error("Error al leer productos:", error.message);
    process.exit(1);
  }

  const pending = (products ?? []).filter(
    (p) => !p.image_urls || p.image_urls.length === 0
  );

  console.log(`Actualizando ${pending.length} de ${products?.length ?? 0} productos...`);

  for (const p of pending) {
    const { error: updateError } = await supabase
      .from("products")
      .update({ image_urls: [p.image_url] })
      .eq("id", p.id);

    if (updateError) {
      console.error(`Error en producto ${p.id}:`, updateError.message);
    }
  }

  console.log("Listo.");
}

main();
