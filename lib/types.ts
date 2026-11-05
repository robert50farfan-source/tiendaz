// Orden de los estados: también es el orden en que se listan en el catálogo.
export const PRODUCT_STATUSES = ["disponible", "reservado", "vendido"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const STATUS_LABELS: Record<ProductStatus, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

export type Product = {
  id: string;
  code: string;
  brand: string;
  model: string;
  category: string | null;
  size_us: string | null;
  size_bol: string | null;
  color: string | null;
  condition: string | null;
  usage_level: string | null;
  buy_price: number | null;
  sale_price: number;
  provider: string | null;
  intake_date: string | null;
  location: string | null;
  notes: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  status: ProductStatus;
  created_at: string;
};

// Columnas que el público (rol anon) puede leer. buy_price, provider, intake_date
// y location son internas: solo el admin autenticado las ve (ver supabase/schema.sql).
// Si se agrega una columna pública, sumarla aquí y en el grant del schema.
export const PUBLIC_PRODUCT_COLUMNS =
  "id, code, brand, model, category, size_us, size_bol, color, condition, usage_level, sale_price, notes, image_url, image_urls, status, created_at";

export type PublicProduct = Omit<Product, "buy_price" | "provider" | "intake_date" | "location">;

export type Settings = {
  id: number;
  whatsapp_number: string | null;
  updated_at: string;
};
