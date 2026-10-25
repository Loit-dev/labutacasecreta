-- Fase 2: guarda la valoración (1-5) de lo que el usuario marca como
-- "Ya la vi", ligada a su cuenta. Pégalo en Supabase → SQL Editor →
-- New query → Run.

create table if not exists public.watched (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id bigint not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  rating smallint check (rating between 1 and 5),
  genres text[] default '{}',
  seen_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
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
