-- Fase 7: Sistema de logros. Pégalo en Supabase → SQL Editor → New
-- query → Run. Diseño completo en el proyecto de Claude
-- (claude/sistema-logros.md): 12 familias generales + 18 de género (5
-- niveles cada una) + 3 estacionales sin nivel + "Beta tester".

-- ─────────────────────────────────────────────────────────────────
-- user_achievements: un nivel desbloqueado = una fila. El nivel
-- actual de una familia es MAX(level) agrupado por achievement_key.
-- Las 3 estacionales y "beta_tester" se guardan con level = 1 (no
-- tienen niveles, solo "conseguido o no").
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_key text not null,
  level smallint not null check (level between 1 and 5),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_key, level)
);

alter table public.user_achievements enable row level security;

drop policy if exists "user_achievements: leer lo propio" on public.user_achievements;
create policy "user_achievements: leer lo propio"
  on public.user_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "user_achievements: insertar lo propio" on public.user_achievements;
create policy "user_achievements: insertar lo propio"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- user_share_events: el evento "share_done" (lib/analytics.ts) ya
-- existe pero solo va a Vercel Analytics (agregado, no por usuario).
-- Esta tabla sí cuenta por cuenta, para el logro "Compartir".
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.user_share_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  screen text not null check (screen in ('profile', 'compatibility', 'summary', 'watched')),
  created_at timestamptz not null default now()
);

alter table public.user_share_events enable row level security;

drop policy if exists "user_share_events: leer lo propio" on public.user_share_events;
create policy "user_share_events: leer lo propio"
  on public.user_share_events for select
  using (auth.uid() = user_id);

drop policy if exists "user_share_events: insertar lo propio" on public.user_share_events;
create policy "user_share_events: insertar lo propio"
  on public.user_share_events for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- watched.tmdb_vote_average: media de TMDb (0-10) del título en el
-- momento de marcarlo como visto. Necesaria para el logro "Nota
-- media" (comparar tu nota con la media). Las filas guardadas ANTES
-- de este cambio quedan con este valor a null y no cuentan para ese
-- logro — limitación conocida y documentada, no hace falta backfill.
-- ─────────────────────────────────────────────────────────────────

alter table public.watched
  add column if not exists tmdb_vote_average numeric(3, 1);
