-- Fase 2: guarda la valoración (1-5, con medias estrellas: 1, 1.5,
-- 2...5) de lo que el usuario marca como "Ya la vi", ligada a su
-- cuenta. Pégalo en Supabase → SQL Editor → New query → Run.
-- Si ya tenías esta tabla creada (con "rating" como smallint, solo
-- estrellas enteras), volver a pegar y ejecutar este archivo entero
-- amplía la columna para admitir medias estrellas sin perder datos.

create table if not exists public.watched (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id bigint not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  rating numeric(2, 1),
  genres text[] default '{}',
  seen_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

-- Tablas creadas antes de las medias estrellas: amplía la columna de
-- smallint a numeric(2,1) para poder guardar valores como 3.5.
alter table public.watched
  alter column rating type numeric(2, 1);

alter table public.watched
  drop constraint if exists watched_rating_check;

alter table public.watched
  add constraint watched_rating_check check (
    rating is null
    or (rating >= 1 and rating <= 5 and (rating * 2) = floor(rating * 2))
  );

alter table public.watched enable row level security;

-- Cada persona solo puede leer y escribir sus propias filas.
create policy "watched: leer lo propio"
  on public.watched for select
  using (auth.uid() = user_id);

create policy "watched: insertar lo propio"
  on public.watched for insert
  with check (auth.uid() = user_id);

create policy "watched: actualizar lo propio"
  on public.watched for update
  using (auth.uid() = user_id);

create policy "watched: borrar lo propio"
  on public.watched for delete
  using (auth.uid() = user_id);
