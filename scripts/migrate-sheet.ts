// Migra data/inventario.csv (exportado del Sheet "Inventario_Zapatillas_Igor") a Supabase.
// Uso: npx tsx scripts/migrate-sheet.ts
// Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
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

type SheetRow = {
  code: string;
  brand: string;
  model: string;
  category: string;
  size_raw: string;
  color: string;
  condition: string;
  usage_level: string;
  buy_price: string;
  sale_price: string;
  provider: string;
  intake_date: string;
  location: string;
  notes: string;
  image_url: string;
  status_raw: string;
  profit: string;
};

// "us=9.5; bol=41" -> { size_us: "9.5", size_bol: "41" }
function parseSize(raw: string) {
  const sizeUsMatch = raw.match(/us\s*=\s*([\d.,]+)/i);
  const sizeBolMatch = raw.match(/bol\s*=\s*([\d.,]+)/i);
  return {
    size_us: sizeUsMatch ? sizeUsMatch[1].replace(",", ".").trim() : null,
    size_bol: sizeBolMatch ? sizeBolMatch[1].trim() : null,
  };
}

// "14/12/25" (dd/mm/aa) -> "2025-12-14"
function parseIntakeDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function mapStatus(raw: string): "disponible" | "vendido" {
  return raw.trim().toLowerCase() === "vendido" ? "vendido" : "disponible";
}

async function main() {
  const csvPath = path.join(__dirname, "..", "data", "inventario.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const rows: SheetRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const products = rows.map((row) => {
    const { size_us, size_bol } = parseSize(row.size_raw);
    return {
      code: row.code,
      brand: row.brand,
      model: row.model.trim(),
      category: row.category || null,
      size_us,
      size_bol,
      color: row.color || null,
      condition: row.condition || null,
      usage_level: row.usage_level || null,
      buy_price: row.buy_price ? Number(row.buy_price) : null,
      sale_price: Number(row.sale_price),
      provider: row.provider || null,
      intake_date: parseIntakeDate(row.intake_date),
      location: row.location || null,
      notes: row.notes || null,
      image_url: row.image_url || null,
      status: mapStatus(row.status_raw),
    };
  });

  console.log(`Migrando ${products.length} productos...`);

  const { data, error } = await supabase
    .from("products")
    .upsert(products, { onConflict: "code" })
    .select("code");

  if (error) {
    console.error("Error al migrar:", error.message);
    process.exit(1);
  }

  console.log(`OK: ${data?.length ?? 0} productos insertados/actualizados.`);
}

main();
