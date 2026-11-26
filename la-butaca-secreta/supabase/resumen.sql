-- Fase 4: "Mi Resumen" — función para el toque competitivo ("top X %
-- del mes"). Compara cuántos títulos ha visto el usuario este mes
-- frente al resto de cuentas, pero solo devuelve un número agregado:
-- nunca expone filas ni datos de otras personas. Pégalo en Supabase
-- → SQL Editor → New query → Run.

create or replace function public.my_month_rank()
returns table (
  mine integer,
  percentile integer,
  total_users integer
)
language sql
security definer
set search_path = public
stable
as $$
  with counts as (
    select user_id, count(*) as n
    from public.watched
    where seen_at >= date_trunc('month', now())
    group by user_id
  ),
  me as (
    select coalesce(
      (select n from counts where user_id = auth.uid()),
      0
    ) as n
  )
  select
    me.n as mine,
    case
      when (select count(*) from counts) = 0 then 0
      else (
        100 * (select count(*) from counts where n <= me.n)
        / (select count(*) from counts)
      )
    end as percentile,
    (select count(*) from counts) as total_users
  from me;
$$;

-- Solo la ejecuta gente logueada, y solo para su propio recuento
-- (auth.uid() dentro de la función, nunca un id que se pueda pasar).
grant execute on function public.my_month_rank() to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 2026-11 · Resumen Anual ("Wrapped"): "Trendy y joya oculta" necesita
-- saber cuánta gente de la app ha visto cada título tuyo este año —
-- un dato cruzado entre cuentas que hoy no se agrega en ningún sitio
-- (my_month_rank es solo tu percentil, no por título). Recibe tus
-- propios tmdb_id/media_type (los que ya tienes en el cliente) y
-- devuelve, por cada uno, cuántos usuarios DISTINTOS lo vieron este
-- año — nunca quién, solo el recuento. Pégalo en Supabase → SQL Editor
-- → New query → Run.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.title_watch_counts(
  p_tmdb_ids integer[],
  p_media_types text[],
  p_year integer
)
returns table (
  tmdb_id integer,
  media_type text,
  watcher_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    pairs.tmdb_id,
    pairs.media_type,
    count(distinct w.user_id)::integer as watcher_count
  from unnest(p_tmdb_ids, p_media_types) as pairs(tmdb_id, media_type)
  left join public.watched w
    on w.tmdb_id = pairs.tmdb_id
    and w.media_type = pairs.media_type
    and extract(year from w.seen_at) = p_year
  group by pairs.tmdb_id, pairs.media_type;
$$;

-- Cualquier usuario logueado puede pedir el recuento de SUS propios
-- títulos (los tmdb_id/media_type se los pasa él mismo desde el
-- cliente) — la función no expone quién vio qué, solo un número.
grant execute on function public.title_watch_counts(integer[], text[], integer) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 2026-11 · Resumen Anual ("Wrapped"): comparativa con el resto de la
-- app para TODO el año del resumen (my_month_rank, más arriba, es solo
-- del mes en curso). Mismo patrón exacto: solo un percentil y un total
-- de cuentas, nunca filas ni datos de nadie más. Pégalo en Supabase →
-- SQL Editor → New query → Run.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.my_year_rank(p_year integer)
returns table (
  mine integer,
  percentile integer,
  total_users integer
)
language sql
security definer
set search_path = public
stable
as $$
  with counts as (
    select user_id, count(*) as n
    from public.watched
    where extract(year from seen_at) = p_year
    group by user_id
  ),
  me as (
    select coalesce(
      (select n from counts where user_id = auth.uid()),
      0
    ) as n
  )
  select
    me.n as mine,
    case
      when (select count(*) from counts) = 0 then 0
      else (
        100 * (select count(*) from counts where n <= me.n)
        / (select count(*) from counts)
      )
    end as percentile,
    (select count(*) from counts) as total_users
  from me;
$$;

-- Solo la ejecuta gente logueada, y solo para su propio recuento
-- (auth.uid() dentro de la función, nunca un id que se pueda pasar).
grant execute on function public.my_year_rank(integer) to authenticated;
