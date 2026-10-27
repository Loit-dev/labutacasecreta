-- Fase 6: Amigos, seguidores, listas compartidas y recomendaciones.
-- Pégalo en Supabase → SQL Editor → New query → Run.
--
-- Resumen de las reglas (ver docs/DECISIONS.md y el documento de
-- diseño del proyecto "disenio-amigos-sociales.md"):
--   * Seguir es instantáneo (sin aprobación). Amistad es solicitud +
--     aceptación mutua.
--   * Diario (watched), favorita y "pendientes" son visibles por
--     defecto a quien te sigue. Las listas son privadas por defecto,
--     con un toggle explícito "is_public" por lista.
--   * Una lista puede además tener colaboradores (edición), algo
--     independiente de si es pública o no.

-- ─────────────────────────────────────────────────────────────────
-- profiles: el @usuario público. No existía ninguna tabla de perfil
-- hasta ahora (el login es solo por email mágico).
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$')
);

alter table public.profiles enable row level security;

-- Cualquier persona logueada puede leer cualquier perfil: lo necesita
-- el buscador (siempre abierto) y el feed/perfil público. No se
-- guarda el email aquí, así que no hay fuga de datos sensibles.
drop policy if exists "profiles: leer todos (logueado)" on public.profiles;
create policy "profiles: leer todos (logueado)"
  on public.profiles for select
  using (auth.uid() is not null);

drop policy if exists "profiles: crear el propio" on public.profiles;
create policy "profiles: crear el propio"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles: actualizar el propio" on public.profiles;
create policy "profiles: actualizar el propio"
  on public.profiles for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- follows: seguir instantáneo y asimétrico.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

drop policy if exists "follows: leer lo propio" on public.follows;
create policy "follows: leer lo propio"
  on public.follows for select
  using (auth.uid() = follower_id or auth.uid() = followee_id);

drop policy if exists "follows: seguir" on public.follows;
create policy "follows: seguir"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "follows: dejar de seguir" on public.follows;
create policy "follows: dejar de seguir"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ─────────────────────────────────────────────────────────────────
-- friend_requests: amistad mutua, solicitud + aceptación. Una fila
-- con status = 'accepted' ES la amistad (no hay tabla separada).
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friend_requests_no_self check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

alter table public.friend_requests enable row level security;

drop policy if exists "friend_requests: leer lo propio" on public.friend_requests;
create policy "friend_requests: leer lo propio"
  on public.friend_requests for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friend_requests: pedir amistad" on public.friend_requests;
create policy "friend_requests: pedir amistad"
  on public.friend_requests for insert
  with check (auth.uid() = requester_id and status = 'pending');

-- Solo quien la recibe puede aceptarla/rechazarla.
drop policy if exists "friend_requests: responder" on public.friend_requests;
create policy "friend_requests: responder"
  on public.friend_requests for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

-- Quien la envió puede retirarla mientras esté pendiente.
drop policy if exists "friend_requests: retirar" on public.friend_requests;
create policy "friend_requests: retirar"
  on public.friend_requests for delete
  using (auth.uid() = requester_id and status = 'pending');

-- ─────────────────────────────────────────────────────────────────
-- lists: añade el toggle de visibilidad pública (antes solo privada).
-- ─────────────────────────────────────────────────────────────────

alter table public.lists
  add column if not exists is_public boolean not null default false;

-- ─────────────────────────────────────────────────────────────────
-- list_invites: invitar a colaborar en una lista. Una fila con
-- status = 'accepted' ES la colaboración activa (igual patrón que
-- friend_requests).
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.list_invites (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  invited_user_id uuid not null references auth.users (id) on delete cascade,
  invited_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (list_id, invited_user_id)
);

alter table public.list_invites enable row level security;

-- Función auxiliar: ¿es esta persona dueña o colaboradora activa de
-- la lista? La usan varias políticas de abajo.
create or replace function public.can_manage_list(p_list_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.lists l
    where l.id = p_list_id and l.user_id = p_user_id
  ) or exists (
    select 1 from public.list_invites li
    where li.list_id = p_list_id
      and li.invited_user_id = p_user_id
      and li.status = 'accepted'
  );
$$;

grant execute on function public.can_manage_list(uuid, uuid) to authenticated;

drop policy if exists "list_invites: leer lo que me toca" on public.list_invites;
create policy "list_invites: leer lo que me toca"
  on public.list_invites for select
  using (
    auth.uid() = invited_user_id
    or public.can_manage_list(list_id, auth.uid())
  );

-- Cualquier colaborador (no solo el dueño) puede invitar a más gente.
drop policy if exists "list_invites: invitar" on public.list_invites;
create policy "list_invites: invitar"
  on public.list_invites for insert
  with check (
    auth.uid() = invited_by
    and public.can_manage_list(list_id, auth.uid())
  );

-- Solo quien recibe la invitación puede aceptarla/rechazarla.
drop policy if exists "list_invites: responder" on public.list_invites;
create policy "list_invites: responder"
  on public.list_invites for update
  using (auth.uid() = invited_user_id)
  with check (auth.uid() = invited_user_id);

-- Echar a un colaborador: SOLO el dueño de la lista (decisión
-- explícita — evita que colaboradores se echen entre ellos). Quien
-- recibió la invitación también puede borrar su propia fila pendiente
-- para "retirarse" de una invitación sin usar.
drop policy if exists "list_invites: borrar" on public.list_invites;
create policy "list_invites: borrar"
  on public.list_invites for delete
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_invites.list_id and l.user_id = auth.uid()
    )
    or (auth.uid() = invited_user_id and status = 'pending')
  );

-- ─────────────────────────────────────────────────────────────────
-- Visibilidad cruzada sobre lists / list_items: dueño siempre;
-- colaboradores aceptados; cualquiera si is_public = true.
-- ─────────────────────────────────────────────────────────────────

drop policy if exists "lists: leer compartido o público" on public.lists;
create policy "lists: leer compartido o público"
  on public.lists for select
  using (
    auth.uid() = user_id
    or is_public = true
    or public.can_manage_list(id, auth.uid())
  );

drop policy if exists "lists: colaborador actualiza (is_public lo toca el dueño)"
  on public.lists;
create policy "lists: colaborador actualiza (is_public lo toca el dueño)"
  on public.lists for update
  using (auth.uid() = user_id);

drop policy if exists "list_items: leer compartido o público" on public.list_items;
create policy "list_items: leer compartido o público"
  on public.list_items for select
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_items.list_id
        and (l.user_id = auth.uid() or l.is_public = true)
    )
    or public.can_manage_list(list_items.list_id, auth.uid())
  );

drop policy if exists "list_items: colaborador inserta" on public.list_items;
create policy "list_items: colaborador inserta"
  on public.list_items for insert
  with check (public.can_manage_list(list_items.list_id, auth.uid()));

drop policy if exists "list_items: colaborador actualiza" on public.list_items;
create policy "list_items: colaborador actualiza"
  on public.list_items for update
  using (public.can_manage_list(list_items.list_id, auth.uid()))
  with check (public.can_manage_list(list_items.list_id, auth.uid()));

drop policy if exists "list_items: colaborador borra" on public.list_items;
create policy "list_items: colaborador borra"
  on public.list_items for delete
  using (public.can_manage_list(list_items.list_id, auth.uid()));

-- ─────────────────────────────────────────────────────────────────
-- Visibilidad cruzada sobre watched y favorite: además de "lo
-- propio" (ya existía), quien te sigue puede leerlas.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.follows_me(p_owner_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.follows f
    where f.followee_id = p_owner_id and f.follower_id = auth.uid()
  );
$$;

grant execute on function public.follows_me(uuid) to authenticated;

drop policy if exists "watched: seguidores leen" on public.watched;
create policy "watched: seguidores leen"
  on public.watched for select
  using (auth.uid() = user_id or public.follows_me(user_id));

drop policy if exists "favorite: seguidores leen" on public.favorite;
create policy "favorite: seguidores leen"
  on public.favorite for select
  using (auth.uid() = user_id or public.follows_me(user_id));

-- ─────────────────────────────────────────────────────────────────
-- pending_sync: copia en servidor de "Pendientes" SOLO para cuentas
-- logueadas, para que pueda aparecer en el perfil público de quien
-- te sigue. El dispositivo sigue usando localStorage como fuente
-- principal (lib/watchlist.ts); esta tabla es un espejo de solo
-- lectura para otras personas, escrito por la propia cuenta.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.pending_sync (
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id bigint not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_url text,
  added_at timestamptz not null default now(),
  primary key (user_id, tmdb_id, media_type)
);

alter table public.pending_sync enable row level security;

drop policy if exists "pending_sync: seguidores leen" on public.pending_sync;
create policy "pending_sync: seguidores leen"
  on public.pending_sync for select
  using (auth.uid() = user_id or public.follows_me(user_id));

drop policy if exists "pending_sync: escribir lo propio" on public.pending_sync;
create policy "pending_sync: escribir lo propio"
  on public.pending_sync for insert
  with check (auth.uid() = user_id);

drop policy if exists "pending_sync: borrar lo propio" on public.pending_sync;
create policy "pending_sync: borrar lo propio"
  on public.pending_sync for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- recommendations: una persona te recomienda un título, directo.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users (id) on delete cascade,
  to_user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id bigint not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_url text,
  message text,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz,
  constraint recommendations_no_self check (from_user_id <> to_user_id)
);

alter table public.recommendations enable row level security;

drop policy if exists "recommendations: leer lo que me toca" on public.recommendations;
create policy "recommendations: leer lo que me toca"
  on public.recommendations for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "recommendations: enviar" on public.recommendations;
create policy "recommendations: enviar"
  on public.recommendations for insert
  with check (auth.uid() = from_user_id);

-- Quien la recibe puede marcarla como descartada/añadida (dismissed_at).
drop policy if exists "recommendations: marcar vista" on public.recommendations;
create policy "recommendations: marcar vista"
  on public.recommendations for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

-- ─────────────────────────────────────────────────────────────────
-- reports: moderación básica, solo escritura + lectura de lo propio.
-- La revisión es manual (consulta directa en el panel de Supabase).
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_user_id uuid references auth.users (id) on delete cascade,
  reported_list_id uuid references public.lists (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint reports_target check (
    reported_user_id is not null or reported_list_id is not null
  )
);

alter table public.reports enable row level security;

drop policy if exists "reports: crear" on public.reports;
create policy "reports: crear"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "reports: leer lo propio" on public.reports;
create policy "reports: leer lo propio"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- ─────────────────────────────────────────────────────────────────
-- invite_codes: el código que lleva el QR/enlace de "Compartir mi
-- perfil" o de una invitación a lista. Antes de completar el login,
-- una persona sin cuenta no puede leer nada más (RLS), así que la
-- resolución de "a quién sigo / a qué lista me uno" ocurre en el
-- cliente justo después de iniciar sesión, usando este código.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.invite_codes (
  code text primary key default encode(gen_random_bytes(8), 'hex'),
  created_by uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('follow', 'list_invite')),
  list_id uuid references public.lists (id) on delete cascade,
  created_at timestamptz not null default now(),
  used_by uuid references auth.users (id),
  used_at timestamptz,
  constraint invite_codes_list_kind check (
    (kind = 'list_invite' and list_id is not null)
    or (kind = 'follow' and list_id is null)
  )
);

alter table public.invite_codes enable row level security;

-- Cualquier logueado puede leer un código por su valor exacto (lo
-- necesita para resolverlo), pero nunca listar los de otra persona:
-- sin índice por created_by expuesto en una política "for select
-- using (true)" no hay forma de enumerarlos sin conocer el código.
drop policy if exists "invite_codes: leer por código" on public.invite_codes;
create policy "invite_codes: leer por código"
  on public.invite_codes for select
  using (auth.uid() is not null);

drop policy if exists "invite_codes: crear el propio" on public.invite_codes;
create policy "invite_codes: crear el propio"
  on public.invite_codes for insert
  with check (auth.uid() = created_by);

drop policy if exists "invite_codes: marcar usado" on public.invite_codes;
create policy "invite_codes: marcar usado"
  on public.invite_codes for update
  using (auth.uid() is not null and used_by is null)
  with check (used_by = auth.uid());
