-- Fase 7c: notificaciones de "me gusta" en tus listas.
-- Requiere haber ejecutado antes listas_populares.sql.
-- Pégalo en Supabase → SQL Editor → New query → Run.
-- Para deshacerlo:
--   drop function if exists public.my_list_likes(integer);

-- Los "me gusta" que han recibido MIS listas (sin contar los míos),
-- con quién los dio. list_likes solo deja leer los propios, así que
-- el dueño de la lista los ve a través de esta función.
create or replace function public.my_list_likes(p_limit integer default 30)
returns table (
  list_id uuid,
  list_name text,
  liker_id uuid,
  username text,
  display_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select l.id, l.name, k.user_id, p.username, p.display_name, k.created_at
  from public.list_likes k
  join public.lists l on l.id = k.list_id
  left join public.profiles p on p.user_id = k.user_id
  where l.user_id = auth.uid()
    and k.user_id <> auth.uid()
  order by k.created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

grant execute on function public.my_list_likes(integer) to authenticated;
