-- Fase 7d: notificaciones de comentarios en tus listas.
-- Requiere haber ejecutado antes listas_populares.sql.
-- Pégalo en Supabase → SQL Editor → New query → Run.
-- Para deshacerlo:
--   drop function if exists public.my_list_comments(integer);

-- Comentarios que otras personas han dejado en MIS listas.
create or replace function public.my_list_comments(p_limit integer default 30)
returns table (
  comment_id uuid,
  list_id uuid,
  list_name text,
  author_id uuid,
  username text,
  display_name text,
  body text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, l.id, l.name, c.user_id, p.username, p.display_name, c.body, c.created_at
  from public.list_comments c
  join public.lists l on l.id::text = c.list_key
  left join public.profiles p on p.user_id = c.user_id
  where l.user_id = auth.uid()
    and c.user_id <> auth.uid()
  order by c.created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

grant execute on function public.my_list_comments(integer) to authenticated;
