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
  status: "disponible" | "vendido";
  created_at: string;
};

export type Settings = {
  id: number;
  whatsapp_number: string | null;
  updated_at: string;
};
