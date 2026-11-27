-- Contador propio de uso de cada función (lib/analytics.ts → track).
-- Vercel Web Analytics solo registra eventos propios en los planes de
-- pago; en el gratuito se perdían. Aquí solo se guarda cuántas veces
-- se usa cada cosa al día: ni quién, ni qué título, ni datos personales.

create table if not exists public.usage_daily (
  day date not null default (now() at time zone 'Europe/Madrid')::date,
  name text not null check (name ~ '^[a-z_]{2,40}$'),
  count integer not null default 0,
  primary key (day, name)
);

-- Sin políticas: nadie lo lee ni lo escribe directamente desde la web;
-- solo a través de las funciones de abajo.
alter table public.usage_daily enable row level security;

-- Suma 1 al evento de hoy. Lo puede llamar cualquiera (también sin
-- sesión), igual que antes el script de Vercel.
create or replace function public.track_usage(p_name text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.usage_daily (name, count)
  select p_name, 1
  where p_name ~ '^[a-z_]{2,40}$'
  on conflict (day, name) do update set count = usage_daily.count + 1;
$$;

grant execute on function public.track_usage(text) to anon, authenticated;

-- Quién puede ver el panel /admin/uso.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;

insert into public.admins (user_id)
select id from auth.users where email = 'carlosfuertesgarcia@gmail.com'
on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to authenticated;

-- Uso por evento y día de los últimos p_days días (solo admins).
create or replace function public.usage_summary(p_days integer default 30)
returns table (day date, name text, count integer)
language sql
security definer
set search_path = public
stable
as $$
  select u.day, u.name, u.count
  from public.usage_daily u
  where public.is_admin()
    and u.day > (now() at time zone 'Europe/Madrid')::date - greatest(p_days, 1)
  order by u.day desc, u.count desc;
$$;

grant execute on function public.usage_summary(integer) to authenticated;
