-- Fase 4: "Mi Resumen" — la tarjeta del medio ("+"), donde cada
-- persona elige a mano su película o serie favorita (no la calcula
-- el recomendador, la elige el usuario desde el buscador). Una fila
-- por cuenta: elegir una nueva sustituye a la anterior. Pégalo en
-- Supabase → SQL Editor → New query → Run.

create table if not exists public.favorite (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tmdb_id bigint not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  updated_at timestamptz not null default now()
);

alter table public.favorite enable row level security;

create policy "favorite: leer lo propio"
  on public.favorite for select
  using (auth.uid() = user_id);

create policy "favorite: insertar lo propio"
  on public.favorite for insert
  with check (auth.uid() = user_id);

create policy "favorite: actualizar lo propio"
  on public.favorite for update
  using (auth.uid() = user_id);

create policy "favorite: borrar lo propio"
  on public.favorite for delete
  using (auth.uid() = user_id);
