-- Estadísticas de visitas del catálogo (panel /admin/stats).
-- Ejecutar en el SQL Editor de Supabase. Es seguro volver a ejecutarlo.

create table if not exists page_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null check (event in ('view', 'whatsapp_click')),
  path text not null check (char_length(path) <= 200),
  product_code text check (char_length(product_code) <= 50),
  -- Id anónimo y aleatorio guardado en el navegador del visitante (para contar únicos).
  visitor_id text not null check (char_length(visitor_id) <= 64),
  referrer text check (char_length(referrer) <= 300)
);

create index if not exists page_events_created_at_idx on page_events (created_at);

alter table page_events enable row level security;

-- Cualquiera puede registrar un evento, pero nadie sin sesión puede leerlos.
drop policy if exists "page_events_public_insert" on page_events;
create policy "page_events_public_insert"
  on page_events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "page_events_admin_read" on page_events;
create policy "page_events_admin_read"
  on page_events for select
  to authenticated
  using (true);

-- Resumen para el panel. Fechas en hora de Bolivia.
create or replace function admin_stats(p_days int default 30)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with
  today as (select (now() at time zone 'America/La_Paz')::date as d),
  ev as (
    select e.*, (e.created_at at time zone 'America/La_Paz')::date as day
    from page_events e
    where e.created_at >= now() - make_interval(days => greatest(p_days, 14) + 1)
  ),
  win as (select * from ev where day > (select d from today) - p_days),
  summary as (
    select
      count(*) filter (where event = 'view' and day = t.d) as views_today,
      count(distinct visitor_id) filter (where event = 'view' and day = t.d) as visitors_today,
      count(*) filter (where event = 'view' and day > t.d - 7) as views_7d,
      count(*) filter (where event = 'view' and day <= t.d - 7 and day > t.d - 14) as views_prev_7d,
      count(distinct visitor_id) filter (where event = 'view' and day > t.d - 7) as visitors_7d,
      count(distinct visitor_id) filter (where event = 'view' and day <= t.d - 7 and day > t.d - 14) as visitors_prev_7d,
      count(*) filter (where event = 'whatsapp_click' and day > t.d - 7) as whatsapp_7d,
      count(*) filter (where event = 'whatsapp_click' and day <= t.d - 7 and day > t.d - 14) as whatsapp_prev_7d,
      count(*) filter (where event = 'view' and day > t.d - p_days) as views_period,
      count(distinct visitor_id) filter (where event = 'view' and day > t.d - p_days) as visitors_period,
      count(*) filter (where event = 'whatsapp_click' and day > t.d - p_days) as whatsapp_period
    from ev, today t
    group by t.d
  ),
  daily as (
    select g.day::date as day,
      coalesce(count(w.id) filter (where w.event = 'view'), 0) as views,
      coalesce(count(distinct w.visitor_id) filter (where w.event = 'view'), 0) as visitors,
      coalesce(count(w.id) filter (where w.event = 'whatsapp_click'), 0) as whatsapp
    from generate_series((select d from today) - (p_days - 1), (select d from today), interval '1 day') as g(day)
    left join win w on w.day = g.day::date
    group by g.day
  ),
  top_products as (
    select w.product_code, p.brand, p.model, p.status,
      count(*) filter (where w.event = 'view') as views,
      count(*) filter (where w.event = 'whatsapp_click') as whatsapp
    from win w
    left join products p on p.code = w.product_code
    where w.product_code is not null
    group by w.product_code, p.brand, p.model, p.status
    order by views desc, whatsapp desc
    limit 10
  ),
  sources as (
    select
      case
        when coalesce(referrer, '') = '' then 'Directo / WhatsApp'
        when referrer ilike '%instagram%' then 'Instagram'
        when referrer ilike '%facebook%' or referrer ilike '%fb.%' then 'Facebook'
        when referrer ilike '%tiktok%' then 'TikTok'
        when referrer ilike '%google%' then 'Google'
        else 'Otros sitios'
      end as source,
      count(*) as views
    from win
    where event = 'view'
    group by 1
    order by views desc
  )
  select jsonb_build_object(
    'days', p_days,
    'today', (select d from today),
    'summary', coalesce((select to_jsonb(s) from summary s), '{}'::jsonb),
    'daily', coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from daily d), '[]'::jsonb),
    'top_products', coalesce((select jsonb_agg(to_jsonb(t) order by t.views desc, t.whatsapp desc) from top_products t), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(to_jsonb(s) order by s.views desc) from sources s), '[]'::jsonb)
  );
$$;

revoke execute on function admin_stats(int) from public, anon;
grant execute on function admin_stats(int) to authenticated;
