-- Esquema inicial: catálogo de zapatillas seminuevas
-- Ejecutar en el SQL Editor de Supabase (Project > SQL Editor > New query)

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  brand text not null,
  model text not null,
  category text,
  size_us text,
  size_bol text,
  color text,
  condition text,
  usage_level text,
  buy_price numeric,
  sale_price numeric not null,
  provider text,
  intake_date date,
  location text,
  notes text,
  image_url text,
  image_urls text[] not null default '{}',
  status text not null default 'disponible' check (status in ('disponible', 'vendido')),
  created_at timestamptz not null default now()
);

-- Migración: agrega la galería de imágenes si la tabla ya existía sin esta columna.
alter table products add column if not exists image_urls text[] not null default '{}';

-- Privacidad: el público (anon) solo puede leer las columnas de venta.
-- buy_price, provider, intake_date y location quedan solo para el admin autenticado.
-- Mantener sincronizado con PUBLIC_PRODUCT_COLUMNS en lib/types.ts.
revoke select on products from anon;
grant select (
  id, code, brand, model, category, size_us, size_bol, color, condition,
  usage_level, sale_price, notes, image_url, image_urls, status, created_at
) on products to anon;

create index if not exists products_status_idx on products (status);
create index if not exists products_brand_idx on products (brand);

alter table products enable row level security;

-- Cualquiera puede leer el catálogo (tienda pública)
create policy "products_public_read"
  on products for select
  using (true);

-- Solo usuarios autenticados (admin) pueden crear/editar/borrar
create policy "products_admin_insert"
  on products for insert
  to authenticated
  with check (true);

create policy "products_admin_update"
  on products for update
  to authenticated
  using (true)
  with check (true);

create policy "products_admin_delete"
  on products for delete
  to authenticated
  using (true);

-- Bucket de storage para fotos de productos (crear también desde Storage > New bucket "product-images", público)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "product_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

create policy "product_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- Estadísticas de visitas: ver supabase/analytics.sql

-- Configuración general de la tienda (fila única, ej. número de WhatsApp de contacto)
create table if not exists settings (
  id smallint primary key default 1 check (id = 1),
  whatsapp_number text,
  updated_at timestamptz not null default now()
);

insert into settings (id) values (1) on conflict (id) do nothing;

alter table settings enable row level security;

create policy "settings_public_read"
  on settings for select
  using (true);

create policy "settings_admin_update"
  on settings for update
  to authenticated
  using (true)
  with check (true);
