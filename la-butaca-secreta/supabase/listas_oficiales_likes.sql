-- Fase 7b: "me gusta" en las listas oficiales de la pestaña Listas
-- (El Canon y Top de La Butaca), que no son filas de public.lists.
-- Pégalo en Supabase → SQL Editor → New query → Run. Se puede volver a
-- pegar entero sin que falle.
--
-- Para deshacerlo:
--   drop function if exists public.official_list_likes_summary();
--   drop table if exists public.official_list_likes;

create table if not exists public.official_list_likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  list_key text not null check (list_key in ('canon', 'top')),
  created_at timestamptz not null default now(),
  primary key (user_id, list_key)
);

alter table public.official_list_likes enable row level security;

drop policy if exists "official_list_likes: leer lo propio" on public.official_list_likes;
create policy "official_list_likes: leer lo propio"
  on public.official_list_likes for select
  using (auth.uid() = user_id);

drop policy if exists "official_list_likes: dar me gusta" on public.official_list_likes;
create policy "official_list_likes: dar me gusta"
  on public.official_list_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "official_list_likes: quitar me gusta" on public.official_list_likes;
create policy "official_list_likes: quitar me gusta"
  on public.official_list_likes for delete
  using (auth.uid() = user_id);

-- Recuento total y si la persona actual le ha dado "me gusta".
create or replace function public.official_list_likes_summary()
returns table (
  list_key text,
  likes_total integer,
  liked_by_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    k.list_key,
    (select count(*)::int from public.official_list_likes o where o.list_key = k.list_key),
    exists (
      select 1 from public.official_list_likes o
      where o.list_key = k.list_key and o.user_id = auth.uid()
    )
  from (values ('canon'), ('top')) as k(list_key);
$$;

grant execute on function public.official_list_likes_summary() to anon, authenticated;
