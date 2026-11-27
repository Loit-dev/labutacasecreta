-- Fase 7e: mejoras de la pestaña Listas y de las notificaciones.
-- Requiere haber ejecutado antes listas_populares.sql,
-- notificaciones_likes.sql y notificaciones_comentarios.sql.
-- Pégalo en Supabase → SQL Editor → New query → Run. Se puede volver a
-- pegar entero sin que falle.
--
--   * public_list_meta: datos de una lista pública para su página
--     propia (/lista/[id]).
--   * popular_lists: misma respuesta que antes, pero calculada con
--     agregados en vez de una subconsulta por lista (escala mejor), y
--     con índices que la acompañan.
--   * notification_reads: "hasta cuándo he visto las notificaciones",
--     guardado en la cuenta (antes solo en cada dispositivo).
--   * my_notification_badge: el número de la bolita en una sola
--     consulta.
--
-- Para deshacerlo:
--   drop function if exists public.my_notification_badge();
--   drop function if exists public.my_notifications_last_seen();
--   drop function if exists public.mark_notifications_seen();
--   drop table if exists public.notification_reads;
--   drop function if exists public.public_list_meta(uuid);
--   (popular_lists se restaura volviendo a ejecutar listas_populares.sql)

-- ─────────────────────────────────────────────────────────────────
-- Índices
-- ─────────────────────────────────────────────────────────────────

create index if not exists list_items_list_added_idx
  on public.list_items (list_id, added_at);

create index if not exists lists_public_created_idx
  on public.lists (created_at desc)
  where is_public = true;

create index if not exists list_likes_created_idx
  on public.list_likes (created_at desc);

create index if not exists list_comments_created_idx
  on public.list_comments (created_at desc);

-- ─────────────────────────────────────────────────────────────────
-- public_list_meta: una lista pública concreta (si no es pública o no
-- existe, no devuelve nada).
-- ─────────────────────────────────────────────────────────────────

create or replace function public.public_list_meta(p_list_id uuid)
returns table (
  id uuid,
  name text,
  username text,
  items_count integer,
  likes_total integer,
  created_at timestamptz
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
    (select count(*)::int from public.list_likes k where k.list_id = l.id),
    l.created_at
  from public.lists l
  left join public.profiles p on p.user_id = l.user_id
  where l.id = p_list_id and l.is_public = true;
$$;

grant execute on function public.public_list_meta(uuid) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- popular_lists: misma firma y columnas que en listas_populares.sql.
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
  with item_counts as (
    select li.list_id, count(*)::int as n
    from public.list_items li
    join public.lists l on l.id = li.list_id and l.is_public = true
    group by li.list_id
  ),
  like_counts as (
    select
      k.list_id,
      count(*)::int as total,
      count(*) filter (
        where k.created_at >= now() - make_interval(days => greatest(p_days, 1))
      )::int as recent
    from public.list_likes k
    join public.lists l on l.id = k.list_id and l.is_public = true
    group by k.list_id
  ),
  ranked as (
    select
      l.id,
      l.name,
      l.user_id,
      l.created_at,
      ic.n as items_count,
      coalesce(lc.recent, 0) as likes_recent,
      coalesce(lc.total, 0) as likes_total
    from public.lists l
    join item_counts ic on ic.list_id = l.id
    left join like_counts lc on lc.list_id = l.id
    where l.is_public = true
    order by likes_recent desc, likes_total desc, l.created_at desc
    limit least(greatest(p_limit, 1), 50)
  )
  select
    r.id,
    r.name,
    p.username,
    r.items_count,
    r.likes_recent,
    r.likes_total,
    exists (
      select 1 from public.list_likes k
      where k.list_id = r.id and k.user_id = auth.uid()
    ),
    coalesce(
      (select array_agg(x.poster_url order by x.added_at)
         from (
           select li.poster_url, li.added_at
           from public.list_items li
           where li.list_id = r.id and li.poster_url is not null
           order by li.added_at
           limit 8
         ) x),
      '{}'
    )
  from ranked r
  left join public.profiles p on p.user_id = r.user_id
  order by r.likes_recent desc, r.likes_total desc, r.created_at desc;
$$;

grant execute on function public.popular_lists(integer, integer) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- notification_reads: última vez que la cuenta abrió Notificaciones.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.notification_reads (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.notification_reads enable row level security;

drop policy if exists "notification_reads: leer lo propio" on public.notification_reads;
create policy "notification_reads: leer lo propio"
  on public.notification_reads for select
  using (auth.uid() = user_id);

create or replace function public.mark_notifications_seen()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notification_reads (user_id, last_seen_at)
  select auth.uid(), now()
  where auth.uid() is not null
  on conflict (user_id) do update set last_seen_at = excluded.last_seen_at;
$$;

grant execute on function public.mark_notifications_seen() to authenticated;

create or replace function public.my_notifications_last_seen()
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select last_seen_at from public.notification_reads where user_id = auth.uid();
$$;

grant execute on function public.my_notifications_last_seen() to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- my_notification_badge: lo mismo que cuenta la pantalla de
-- Notificaciones (lib/supabase/notifications.ts → countBadge), en una
-- sola consulta. Lo pendiente cuenta siempre; lo informativo (nuevos
-- seguidores, "me gusta" y comentarios en mis listas) solo si es
-- posterior a la última vez que se abrieron las notificaciones.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.my_notification_badge()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  with me as (
    select
      auth.uid() as id,
      coalesce(
        (select last_seen_at from public.notification_reads where user_id = auth.uid()),
        '-infinity'::timestamptz
      ) as seen
  )
  select (
    (select count(*) from public.friend_requests f, me
      where f.addressee_id = me.id and f.status = 'pending')
    + (select count(*) from public.list_invites i, me
      where i.invited_user_id = me.id and i.status = 'pending')
    + (select count(*) from public.recommendations r, me
      where r.to_user_id = me.id and r.dismissed_at is null)
    + (select count(*) from public.follows f, me
      where f.followee_id = me.id and f.created_at > me.seen
        and exists (select 1 from public.profiles p where p.user_id = f.follower_id))
    + (select count(*) from public.list_likes k
        join public.lists l on l.id = k.list_id, me
      where l.user_id = me.id and k.user_id <> me.id and k.created_at > me.seen)
    + (select count(*) from public.list_comments c
        join public.lists l on l.id::text = c.list_key, me
      where l.user_id = me.id and c.user_id <> me.id and c.created_at > me.seen)
  )::int;
$$;

grant execute on function public.my_notification_badge() to authenticated;
