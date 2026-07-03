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
  status text not null default 'disponible' check (status in ('disponible', 'vendido')),
  created_at timestamptz not null default now()
);

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
