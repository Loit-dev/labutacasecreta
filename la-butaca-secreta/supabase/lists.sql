-- Fase 5: "Mi cuenta" → pestaña Listas. Varias listas con nombre
-- propio por cuenta (p. ej. "Terror"), cada una con sus títulos.
-- Pégalo en Supabase → SQL Editor → New query → Run.

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  tmdb_id bigint not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_url text,
  added_at timestamptz not null default now(),
  unique (list_id, tmdb_id, media_type)
);

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- lists: cada persona solo ve y toca sus propias listas.
drop policy if exists "lists: leer lo propio" on public.lists;
create policy "lists: leer lo propio"
  on public.lists for select
  using (auth.uid() = user_id);

drop policy if exists "lists: insertar lo propio" on public.lists;
create policy "lists: insertar lo propio"
  on public.lists for insert
  with check (auth.uid() = user_id);

drop policy if exists "lists: actualizar lo propio" on public.lists;
create policy "lists: actualizar lo propio"
  on public.lists for update
  using (auth.uid() = user_id);

drop policy if exists "lists: borrar lo propio" on public.lists;
create policy "lists: borrar lo propio"
  on public.lists for delete
  using (auth.uid() = user_id);

-- list_items: solo si la lista a la que pertenecen es tuya.
drop policy if exists "list_items: leer lo propio" on public.list_items;
create policy "list_items: leer lo propio"
  on public.list_items for select
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_items.list_id and l.user_id = auth.uid()
    )
  );

drop policy if exists "list_items: insertar lo propio" on public.list_items;
create policy "list_items: insertar lo propio"
  on public.list_items for insert
  with check (
    exists (
      select 1 from public.lists l
      where l.id = list_items.list_id and l.user_id = auth.uid()
    )
  );

drop policy if exists "list_items: borrar lo propio" on public.list_items;
create policy "list_items: borrar lo propio"
  on public.list_items for delete
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_items.list_id and l.user_id = auth.uid()
    )
  );
