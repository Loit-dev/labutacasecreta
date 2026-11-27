-- Fase 7: pestaña "Listas" de la portada (estilo Letterboxd).
--   * "Me gusta" en listas públicas (list_likes).
--   * Listas públicas populares de la semana (popular_lists).
--   * Ranking oficial "Top de La Butaca" por nota media de las
--     cuentas (top_rated_titles), con media bayesiana para que un
--     título con un solo 5 no se cuele arriba del todo.
-- Requiere haber ejecutado antes lists.sql, watched.sql y social.sql.
-- Pégalo en Supabase → SQL Editor → New query → Run. Se puede volver a
-- pegar entero sin que falle.
--
-- Para deshacerlo:
--   drop function if exists public.list_comments_for(text);
--   drop table if exists public.list_comments;
--   drop function if exists public.list_key_is_public(text);
--   drop function if exists public.top_rated_titles(integer, integer);
--   drop function if exists public.popular_lists(integer, integer);
--   drop table if exists public.list_likes;

-- ─────────────────────────────────────────────────────────────────
-- list_likes: un "me gusta" por persona y lista.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.list_likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, list_id)
);

create index if not exists list_likes_list_created_idx
  on public.list_likes (list_id, created_at desc);

alter table public.list_likes enable row level security;

drop policy if exists "list_likes: leer lo propio" on public.list_likes;
create policy "list_likes: leer lo propio"
  on public.list_likes for select
  using (auth.uid() = user_id);

-- Solo se puede dar "me gusta" a listas públicas.
drop policy if exists "list_likes: dar me gusta" on public.list_likes;
create policy "list_likes: dar me gusta"
  on public.list_likes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.lists l
      where l.id = list_likes.list_id and l.is_public = true
    )
  );

drop policy if exists "list_likes: quitar me gusta" on public.list_likes;
create policy "list_likes: quitar me gusta"
  on public.list_likes for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- popular_lists: listas públicas ordenadas por "me gusta" recibidos en
-- los últimos p_days días (y, a igualdad, por total y por recientes).
-- Devuelve solo datos ya públicos: nombre de la lista, @usuario,
-- recuentos y los primeros pósters. Funciona también sin sesión.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.popular_lists(
  p_days integer default 7,
  p_limit integer default 20
)
returns table (
  id uuid,
  name text,
  username text,
  items_count integer,
  likes_recent integer,
  likes_total integer,
  liked_by_me boolean,
  posters text[]
)
language sql
security definer
set search_path = public
stable
as $$
  select
    l.id,
    l.name,
    p.username,
    (select count(*)::int from public.list_items li where li.list_id = l.id),
    (select count(*)::int from public.list_likes k
       where k.list_id = l.id
         and k.created_at >= now() - make_interval(days => greatest(p_days, 1))),
    (select count(*)::int from public.list_likes k where k.list_id = l.id),
    exists (
      select 1 from public.list_likes k
      where k.list_id = l.id and k.user_id = auth.uid()
    ),
    coalesce(
      (select array_agg(x.poster_url order by x.added_at)
         from (
           select li.poster_url, li.added_at
           from public.list_items li
           where li.list_id = l.id and li.poster_url is not null
           order by li.added_at
           limit 8
         ) x),
      '{}'
    )
  from public.lists l
  left join public.profiles p on p.user_id = l.user_id
  where l.is_public = true
    and exists (select 1 from public.list_items li where li.list_id = l.id)
  order by 5 desc, 6 desc, l.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

grant execute on function public.popular_lists(integer, integer) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- top_rated_titles: "Top de La Butaca". Solo agregados (media y
-- número de votos por título), nunca filas ni datos de nadie.
-- Media bayesiana: (v·R + m·C) / (v + m), con R = media del título,
-- v = votos, C = media global y m = p_min_votes.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.top_rated_titles(
  p_min_votes integer default 3,
  p_limit integer default 100
)
returns table (
  tmdb_id bigint,
  media_type text,
  title text,
  poster_url text,
  avg_rating numeric,
  votes integer,
  score numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with rated as (
    select w.tmdb_id, w.media_type, w.rating, w.title, w.poster_url
    from public.watched w
    where w.rating is not null
  ),
  global as (
    select coalesce(avg(rating), 3) as c from rated
  ),
  per_title as (
    select
      r.tmdb_id,
      r.media_type,
      max(r.title) as title,
      max(r.poster_url) as poster_url,
      avg(r.rating) as avg_rating,
      count(*)::int as votes
    from rated r
    group by r.tmdb_id, r.media_type
  )
  select
    t.tmdb_id,
    t.media_type,
    t.title,
    t.poster_url,
    round(t.avg_rating, 2),
    t.votes,
    round(
      (t.votes * t.avg_rating + greatest(p_min_votes, 1) * g.c)
        / (t.votes + greatest(p_min_votes, 1)),
      3
    )
  from per_title t
  cross join global g
  where t.votes >= greatest(p_min_votes, 1)
  order by 7 desc, t.votes desc
  limit least(greatest(p_limit, 1), 500);
$$;

grant execute on function public.top_rated_titles(integer, integer) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- list_comments: comentarios dentro de una lista. list_key es el id
-- (uuid) de una lista pública, o 'canon' / 'top' para las oficiales.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.list_key_is_public(p_list_key text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select p_list_key in ('canon', 'top')
    or exists (
      select 1 from public.lists l
      where l.id::text = p_list_key and l.is_public = true
    );
$$;

grant execute on function public.list_key_is_public(text) to anon, authenticated;

create table if not exists public.list_comments (
  id uuid primary key default gen_random_uuid(),
  list_key text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists list_comments_key_created_idx
  on public.list_comments (list_key, created_at);

alter table public.list_comments enable row level security;

-- Leer: se hace con list_comments_for (abajo), que añade el @usuario.
-- Aquí solo lo propio, por si acaso.
drop policy if exists "list_comments: leer lo propio" on public.list_comments;
create policy "list_comments: leer lo propio"
  on public.list_comments for select
  using (auth.uid() = user_id);

drop policy if exists "list_comments: comentar" on public.list_comments;
create policy "list_comments: comentar"
  on public.list_comments for insert
  with check (
    auth.uid() = user_id
    and public.list_key_is_public(list_key)
  );

-- Borrar: quien lo escribió, o el dueño de la lista.
drop policy if exists "list_comments: borrar" on public.list_comments;
create policy "list_comments: borrar"
  on public.list_comments for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.lists l
      where l.id::text = list_comments.list_key and l.user_id = auth.uid()
    )
  );

create or replace function public.list_comments_for(p_list_key text)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  username text,
  is_mine boolean,
  can_delete boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    c.body,
    c.created_at,
    p.username,
    c.user_id = auth.uid(),
    c.user_id = auth.uid() or exists (
      select 1 from public.lists l
      where l.id::text = c.list_key and l.user_id = auth.uid()
    )
  from public.list_comments c
  left join public.profiles p on p.user_id = c.user_id
  where c.list_key = p_list_key
    and public.list_key_is_public(p_list_key)
  order by c.created_at asc
  limit 500;
$$;

grant execute on function public.list_comments_for(text) to anon, authenticated;
