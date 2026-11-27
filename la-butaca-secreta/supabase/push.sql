-- Fase 8: avisos push al móvil/ordenador ("me gusta" y comentarios en
-- tus listas). Requiere haber ejecutado antes listas_populares.sql.
-- Pégalo en Supabase → SQL Editor → New query → Run. Se puede volver a
-- pegar entero sin que falle.
--
-- Para deshacerlo:
--   drop function if exists public.push_targets(text, text);
--   drop function if exists public.forget_push_subscription(text);
--   drop table if exists public.push_subscriptions;

-- ─────────────────────────────────────────────────────────────────
-- push_subscriptions: cada dispositivo en el que la persona ha
-- activado los avisos (lo que da el navegador al suscribirse).
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions: leer lo propio" on public.push_subscriptions;
create policy "push_subscriptions: leer lo propio"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "push_subscriptions: crear lo propio" on public.push_subscriptions;
create policy "push_subscriptions: crear lo propio"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions: actualizar lo propio" on public.push_subscriptions;
create policy "push_subscriptions: actualizar lo propio"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions: borrar lo propio" on public.push_subscriptions;
create policy "push_subscriptions: borrar lo propio"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- push_targets: a quién avisar justo después de dar "me gusta"
-- (p_kind = 'like') o comentar (p_kind = 'comment') en una lista.
-- Solo devuelve algo si quien llama acaba de hacerlo de verdad (en los
-- últimos 2 minutos) y la lista es de otra persona. La llama el
-- servidor (/api/push/notify) con la sesión de quien da el "me gusta";
-- las suscripciones nunca llegan al navegador.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.push_targets(p_kind text, p_list_id text)
returns table (
  endpoint text,
  p256dh text,
  auth text,
  actor_username text,
  list_name text,
  comment_body text
)
language sql
security definer
set search_path = public
stable
as $$
  with target as (
    select l.id, l.name, l.user_id
    from public.lists l
    where l.id::text = p_list_id
      and l.user_id <> auth.uid()
  ),
  recent as (
    select null::text as body
    from public.list_likes k, target t
    where p_kind = 'like'
      and k.list_id = t.id
      and k.user_id = auth.uid()
      and k.created_at > now() - interval '2 minutes'
    union all
    select c.body
    from (
      select c.body, c.created_at
      from public.list_comments c, target t
      where p_kind = 'comment'
        and c.list_key = t.id::text
        and c.user_id = auth.uid()
        and c.created_at > now() - interval '2 minutes'
      order by c.created_at desc
      limit 1
    ) c
  )
  select
    s.endpoint,
    s.p256dh,
    s.auth,
    (select username from public.profiles where user_id = auth.uid()),
    t.name,
    (select body from recent limit 1)
  from target t
  join public.push_subscriptions s on s.user_id = t.user_id
  where exists (select 1 from recent);
$$;

grant execute on function public.push_targets(text, text) to authenticated;

-- El servidor borra una suscripción cuando el servicio de avisos dice
-- que ya no existe (el dispositivo la quitó o se desinstaló la app).
create or replace function public.forget_push_subscription(p_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;

grant execute on function public.forget_push_subscription(text) to authenticated;
