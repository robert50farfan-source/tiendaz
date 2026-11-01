// Genera public/og-image.jpg: la imagen que muestra WhatsApp/Instagram/Facebook al
// compartir el link del catálogo. Arma un collage con las fotos de los últimos pares
// disponibles. Volver a correrlo cuando se quiera renovar con pares nuevos
// (WhatsApp cachea la vista previa; puede tardar en verse el cambio).
// Uso: npx tsx scripts/generate-og-image.ts

import path from "node:path";
import dotenv from "dotenv";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const OUTPUT = path.join(__dirname, "..", "public", "og-image.jpg");
const WIDTH = 1200;
const HEIGHT = 630;
const TILE = 285;
const GAP = 14;
const GRID_LEFT = WIDTH - (TILE * 2 + GAP) - 30;
const GRID_TOP = (HEIGHT - (TILE * 2 + GAP)) / 2;
// Bajo ~300 KB WhatsApp muestra la imagen sin problemas.
const MAX_BYTES = 300 * 1024;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function textPanel(): Buffer {
  const line = (y: number, size: number, weight: number, color: string, text: string) =>
    `<text x="60" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeXml(text)}</text>`;

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${line(240, 72, 800, "#ffffff", "Zapatillas")}
    ${line(310, 28, 400, "#d4d4d8", "Pares únicos, revisados")}
    ${line(348, 28, 400, "#d4d4d8", "y listos para usar.")}
    <rect x="60" y="390" width="430" height="64" rx="32" fill="#16a34a"/>
    ${`<text x="275" y="431" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff">Pídelos por WhatsApp</text>`}
    ${line(520, 26, 600, "#a1a1aa", "tiendaz.online")}
  </svg>`;
  return Buffer.from(svg);
}

async function main() {
  const { data: products, error } = await supabase
    .from("products")
    .select("code, image_urls")
    .eq("status", "disponible")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al leer productos:", error.message);
    process.exit(1);
  }

  const tiles: sharp.OverlayOptions[] = [];
  for (const p of products ?? []) {
    if (tiles.length === 4) break;
    const url = p.image_urls?.[0];
    if (!url) continue;

    const res = await fetch(url);
    if (!res.ok) continue;
    const photo = await sharp(Buffer.from(await res.arrayBuffer()))
      .rotate()
      .resize(TILE, TILE, { fit: "cover" })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${TILE}" height="${TILE}"><rect width="${TILE}" height="${TILE}" rx="18" fill="#fff"/></svg>`
          ),
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer();

    const i = tiles.length;
    tiles.push({
      input: photo,
      left: GRID_LEFT + (i % 2) * (TILE + GAP),
      top: GRID_TOP + Math.floor(i / 2) * (TILE + GAP),
    });
    console.log(`  foto ${i + 1}: ${p.code}`);
  }

  if (tiles.length < 4) {
    console.error(`Solo se encontraron ${tiles.length} fotos; se necesitan 4.`);
    process.exit(1);
  }

  const base = sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background: "#18181b" },
  }).composite([{ input: textPanel(), left: 0, top: 0 }, ...tiles]);
  const png = await base.png().toBuffer();

  let output: Buffer = Buffer.alloc(0);
  for (const quality of [85, 78, 70, 62]) {
    output = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (output.length <= MAX_BYTES) break;
  }

  await sharp(output).toFile(OUTPUT);
  console.log(`Listo: ${OUTPUT} (${Math.round(output.length / 1024)} KB)`);
}

main();
