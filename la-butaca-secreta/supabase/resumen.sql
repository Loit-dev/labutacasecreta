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
