# Base de datos

La Butaca Secreta no tiene backend propio para servir recomendaciones
(eso sigue siendo lógica adaptativa + TMDb, ver `CONVERSATION_ENGINE.md`
y `RECOMMENDATION_ENGINE.md`). Lo que sí hay es una base de datos
**Supabase** (PostgreSQL + Auth + Row Level Security) para la parte
opcional de cuenta de usuario: entrar con un enlace mágico por correo,
guardar el diario, la favorita y las listas de cada persona entre
dispositivos, y la capa social opcional (@usuario, seguir, amistad,
listas públicas/compartidas y recomendaciones — ver más abajo).

Sin las variables de entorno de Supabase configuradas, todo lo de
cuenta se oculta (`useAuth().available === false`) y el resto de la
web funciona igual: el login es un extra, no una dependencia dura.

Las migraciones viven en `/supabase` como SQL plano, pensado para
pegar en **Supabase → SQL Editor → New query → Run**. Todas son
idempotentes (usan `create table if not exists`, y las políticas se
borran con `drop policy if exists` antes de recrearse), así que se
pueden volver a ejecutar sin miedo a duplicar nada.

## Tablas

### `watched` (`supabase/watched.sql`)

El diario: qué ha visto cada persona, cuándo y con qué nota. Una fila
por título visto y por usuario (restricción `unique (user_id,
tmdb_id, media_type)`); marcarlo como visto otra vez actualiza la
fila en vez de duplicarla.

| Columna      | Tipo                 | Notas                                             |
| ------------ | -------------------- | -------------------------------------------------- |
| `id`         | uuid (PK)             |                                                    |
| `user_id`    | uuid (FK `auth.users`)| Dueño de la fila                                  |
| `tmdb_id`    | bigint                |                                                    |
| `media_type` | text                  | `'movie'` \| `'tv'`                               |
| `title`      | text                  |                                                    |
| `rating`     | numeric(2,1)          | 1–5, con medias estrellas (1, 1.5 … 5); opcional  |
| `genres`     | text[]                | Para "Mi Resumen" (géneros favoritos)             |
| `seen_at`    | timestamptz           | Fecha en la que se vio; el diario agrupa por mes a partir de aquí |
| `poster_url` | text                  | Portada de TMDb, para el diario; opcional         |

`lib/supabase/watched.ts` expone `saveWatched` (marcar como vista,
mueve `seen_at` a "ahora"), `updateWatchedRating` (cambiar solo la
nota de una entrada ya antigua del diario, sin tocar la fecha) y
`deleteWatched` (borrar una entrada del diario).

### `favorite` (`supabase/favorite.sql`)

La película o serie favorita que cada persona elige a mano en "Mi
Resumen" (no la calcula el recomendador). Una fila por cuenta
(`user_id` es la propia clave primaria): elegir una nueva sustituye a
la anterior.

| Columna      | Tipo                  | Notas              |
| ------------ | --------------------- | ------------------- |
| `user_id`    | uuid (PK, FK `auth.users`) |                 |
| `tmdb_id`    | bigint                 |                    |
| `media_type` | text                   | `'movie'` \| `'tv'` |
| `title`      | text                   |                    |
| `updated_at` | timestamptz            |                    |

### `lists` y `list_items` (`supabase/lists.sql`)

Las listas personalizadas de "Mi cuenta" (p. ej. «Terror», «Pelis de
Navidad»): varias listas por cuenta, cada una con sus propios
títulos.

**`lists`** — una fila por lista:

| Columna      | Tipo                  | Notas |
| ------------ | --------------------- | ----- |
| `id`         | uuid (PK)              |       |
| `user_id`    | uuid (FK `auth.users`) | Dueño de la lista |
| `name`       | text                   |       |
| `created_at` | timestamptz            |       |

**`list_items`** — una fila por título dentro de una lista:

| Columna      | Tipo                  | Notas |
| ------------ | --------------------- | ----- |
| `id`         | uuid (PK)              |       |
| `list_id`    | uuid (FK `lists`, on delete cascade) | Borrar la lista borra sus títulos |
| `tmdb_id`    | bigint                 |       |
| `media_type` | text                   | `'movie'` \| `'tv'` |
| `title`      | text                   |       |
| `poster_url` | text                   | Opcional |
| `added_at`   | timestamptz            |       |

Restricción `unique (list_id, tmdb_id, media_type)`: añadir el mismo
título dos veces a una lista no lo duplica. `lib/supabase/lists.ts`
usa `upsert` para esto (`addListItem`), lo que implica que
`list_items` necesita política de **UPDATE** además de INSERT/SELECT/
DELETE — Postgres la exige para cualquier `INSERT … ON CONFLICT DO
UPDATE`, aunque en la práctica casi siempre inserte de cero. Si esa
política falta, añadir un título a una lista falla en silencio.

### `my_month_rank()` (`supabase/resumen.sql`)

No es una tabla, sino una función (`security definer`) para el toque
competitivo de "Mi Resumen" («más que el X % de las cuentas este
mes»): cuenta cuántos títulos ha visto la persona este mes frente al
resto de cuentas, pero solo devuelve un número agregado (`mine`,
`percentile`, `total_users`) — nunca expone filas ni datos de otras
personas. Solo ejecutable por usuarios autenticados, y siempre sobre
su propio `auth.uid()`.

## Capa social: Amigos (`supabase/social.sql`)

Fase posterior a las cuatro tablas de arriba (ver `DECISIONS.md`,
"2026-10 · Amigos"). Añade perfil público, seguir, amistad, listas
públicas/compartidas, feed, recomendaciones y moderación básica.

### `profiles`

El @usuario público. No existía ningún perfil hasta esta fase (el
login es solo por email).

| Columna        | Tipo                        | Notas |
| -------------- | --------------------------- | ----- |
| `user_id`      | uuid (PK, FK `auth.users`)  |       |
| `username`     | text (unique)                | `^[a-z0-9_]{3,20}$`, validado también en `lib/supabase/profiles.ts` (formato + lista negra básica) |
| `display_name` | text                         | Opcional |
| `created_at`   | timestamptz                  |       |

### `follows`

Seguir, instantáneo y asimétrico (sin aprobación). Clave compuesta
`(follower_id, followee_id)`; sin fila propia de perfil requerida —
basta con tener sesión (`auth.uid()`), lo que permite seguir sin
haber creado aún un `profiles.username` (ver `ProfilePublicScreen.tsx`,
que por eso comprueba el perfil del propio visitante antes de dejar
seguir, y manda a crear el @usuario si falta).

| Columna       | Tipo                       | Notas |
| ------------- | -------------------------- | ----- |
| `follower_id` | uuid (FK `auth.users`)     | PK compuesta con `followee_id` |
| `followee_id` | uuid (FK `auth.users`)     |       |
| `created_at`  | timestamptz                 |       |

### `friend_requests`

Amistad: solicitud + aceptación mutua. Una fila con `status =
'accepted'` ES la amistad (sin tabla separada; mismo patrón en
`list_invites`).

| Columna         | Tipo        | Notas |
| --------------- | ----------- | ----- |
| `id`            | uuid (PK)    |       |
| `requester_id`  | uuid (FK)    |       |
| `addressee_id`  | uuid (FK)    |       |
| `status`        | text         | `'pending'` \| `'accepted'` \| `'rejected'` |
| `created_at` / `responded_at` | timestamptz |  |

### `lists.is_public` + `list_invites`

`lists` gana una columna `is_public` (por defecto `false`): toggle
explícito para que una lista sea visible a cualquier cuenta, no solo
a la propia. Independiente de esto, `list_invites` permite invitar a
colaboradores concretos a editar una lista (pública o no); una fila
`accepted` es la colaboración activa. Solo el dueño de la lista puede
expulsar a un colaborador; quien recibe una invitación pendiente
puede retirarse borrando su propia fila.

### `pending_sync`

Espejo en servidor de "Pendientes", solo para que aparezca en el
perfil público de quien te sigue — la fuente principal sigue siendo
`localStorage` (`lib/watchlist.ts`); esta tabla es de solo lectura
hacia fuera, escrita por la propia cuenta.

| Columna      | Tipo        | Notas |
| ------------ | ----------- | ----- |
| `user_id`    | uuid (FK)    | PK compuesta con `tmdb_id`, `media_type` |
| `tmdb_id`    | bigint       |       |
| `media_type` | text         | `'movie'` \| `'tv'` |
| `title` / `poster_url` | text |  |
| `added_at`   | timestamptz  |       |

Nota: "Descartadas" (`lib/rejected.ts`) **no** tiene equivalente —
sigue siendo solo de `localStorage`, deliberadamente, para que se
mantenga privada incluso en el perfil público (ver `DECISIONS.md`).

### `recommendations`

Una persona le recomienda un título a otra, con mensaje opcional.
Solo las dos partes pueden leer la fila.

| Columna                 | Tipo        | Notas |
| ------------------------ | ----------- | ----- |
| `id`                     | uuid (PK)    |       |
| `from_user_id` / `to_user_id` | uuid (FK) | `check (from_user_id <> to_user_id)` |
| `tmdb_id` / `media_type` / `title` / `poster_url` | — |  |
| `message`                | text         | Opcional |
| `created_at` / `dismissed_at` | timestamptz |  |

### `reports`

Reportar un perfil o una lista. Solo escritura + lectura de lo
propio; la revisión es manual (consulta directa en el panel de
Supabase, sin moderación automática).

| Columna             | Tipo | Notas |
| -------------------- | ---- | ----- |
| `id`                 | uuid (PK) |  |
| `reporter_id`        | uuid (FK) |  |
| `reported_user_id` / `reported_list_id` | uuid (FK), nullable | `check` exige al menos uno de los dos |
| `reason`             | text |  |
| `created_at`         | timestamptz |  |

### `invite_codes`

El código de un solo uso detrás de "Compartir mi perfil" o de una
invitación a lista. Antes de completar el login, una persona sin
cuenta no puede leer nada más por RLS, así que resolver "a quién
sigo / a qué lista me uno" ocurre en el cliente justo después de
iniciar sesión, usando este código (`app/invitar/[codigo]/`).

| Columna      | Tipo | Notas |
| ------------ | ---- | ----- |
| `code`       | text (PK) | Generado por `encode(gen_random_bytes(8), 'hex')` |
| `created_by` | uuid (FK) |  |
| `kind`       | text | `'follow'` \| `'list_invite'` |
| `list_id`    | uuid (FK), nullable | Obligatorio solo si `kind = 'list_invite'` |
| `used_by` / `used_at` | uuid / timestamptz, nullable |  |

Funciones auxiliares `security definer`: `follows_me(p_owner_id)` (te
sigue quien pide) y `can_manage_list(p_list_id, p_user_id)` (dueño o
colaborador aceptado) — las usan las políticas de abajo para no
repetir el mismo `exists (select …)` en cada tabla.

## Logros (`supabase/achievements.sql`)

Fase posterior a Amigos (ver `DECISIONS.md`, "2026-11 · Logros").
33 familias de logros con 5 niveles cada una (12 generales + 18 de
género) más 3 estacionales y "Beta tester" sin niveles (conseguido o
no). La detección es perezosa: se recalcula en el cliente al entrar
en la app o justo tras una acción relevante (nunca en segundo plano
ni por cron), comparando contra lo ya guardado e insertando solo los
niveles nuevos.

### `user_achievements`

Una fila = un nivel desbloqueado. El nivel actual de una familia es
`MAX(level)` agrupado por `achievement_key`.

| Columna            | Tipo        | Notas |
| ------------------- | ----------- | ----- |
| `user_id`           | uuid (FK `auth.users`) | PK compuesta |
| `achievement_key`   | text         | Clave de la familia (`total_visto`, `genero_terror`, `beta_tester`…) |
| `level`             | smallint     | 1–5; las estacionales y "Beta tester" siempre usan 1 |
| `unlocked_at`       | timestamptz  |       |

Solo lectura/inserción de lo propio (`auth.uid() = user_id`); sin
política de `UPDATE` ni `DELETE` — un nivel desbloqueado no se borra.

### `user_share_events`

Cuenta de veces que se ha compartido algo desde cada pantalla, para
el logro "Compartir" (el evento `share_done` de `lib/analytics.ts`
ya existía, pero solo va a Vercel Analytics agregado, no por cuenta).

| Columna      | Tipo        | Notas |
| ------------ | ----------- | ----- |
| `id`         | uuid (PK)    |       |
| `user_id`    | uuid (FK `auth.users`) |  |
| `screen`     | text         | `'profile'` \| `'compatibility'` \| `'summary'` \| `'watched'` |
| `created_at` | timestamptz  |       |

Solo lectura/inserción de lo propio. No guarda qué se compartió, solo
desde qué pantalla.

### `watched.tmdb_vote_average`

Columna nueva en la tabla `watched` ya existente: la nota media de
TMDb (0–10) del título en el momento de marcarlo como visto, para
poder comparar con la nota propia (logro "Nota media"). Numérica,
opcional; las filas guardadas antes de este cambio quedan a `null` y
no cuentan para ese logro concreto — limitación conocida, sin
backfill.

`lib/supabase/achievements.ts` expone `fetchAchievementWatchedRows`,
`fetchStoredAchievementLevels`, `insertUnlockedLevels`,
`recordShareEvent`, `fetchShareEventsCount`,
`fetchRecommendationsSentCount`, `fetchListsCount`,
`fetchCompatibleFriendsCount` y `grantBetaTesterIfEligible`. Toda la
lógica de cálculo (qué nivel corresponde a cada familia) vive en
`lib/achievements/compute.ts`, sin dependencias de Supabase ni de
React, para poder testearla con `node --test`
(`tests/achievements.test.ts`).

### Comparar logros con amigos

No es una tabla nueva: `components/achievements/
CompareAchievements.tsx` reutiliza los datos de `watched` ya
legibles vía `follows_me()` (ver más abajo) para calcular el
progreso de un amigo en el cliente — nunca lee `user_achievements` de
otra cuenta. Por eso solo se comparan las familias que ya eran
visibles por la capa social (generales calculables desde `watched`),
no las que dependen de datos privados de la otra cuenta (listas,
compartidos, amigos en común): `COMPARABLE_GENERAL_KEYS` en ese mismo
archivo es la lista exacta.

## Seguridad (RLS)

Todas las tablas tienen **Row Level Security** activada. Para
`watched`, `favorite`, `lists`, `list_items` y `pending_sync` la
regla de base sigue siendo `auth.uid() = user_id` — nadie lee ni
escribe filas de otra cuenta por defecto —, pero la capa social añade
**excepciones explícitas y deliberadas**:

- `watched`, `favorite` y `pending_sync` también se pueden leer (solo
  lectura) si `follows_me(user_id)` es cierto, es decir, si quien
  pregunta te sigue.
- `lists` y `list_items` también se pueden leer si `is_public = true`,
  o si quien pregunta es colaborador aceptado (`can_manage_list`).
- `profiles` se puede leer entera por cualquier cuenta logueada (lo
  necesita el buscador, que es siempre abierto por decisión de
  producto) — no expone el correo, solo @usuario y nombre visible.

La seguridad sigue viviendo en la base de datos, no solo en el
cliente: estas excepciones están en las políticas SQL de
`supabase/social.sql`, no en el código de la app.

## Dónde se usa cada tabla

| Pantalla                          | Tablas                        |
| ---------------------------------- | ------------------------------ |
| Mi cuenta → Perfil (Mi Resumen)    | `watched`, `favorite`, `my_month_rank()` |
| Mi cuenta → Diario                 | `watched`                     |
| Mi cuenta → Listas                 | `lists`, `list_items`, `list_invites` |
| Mi cuenta → Pendientes             | `localStorage` (`lib/watchlist.ts`), por dispositivo; espejo de solo lectura en `pending_sync` para quien te sigue |
| Mi cuenta → Amigos                 | `profiles`, `follows`, `friend_requests`, `recommendations`, `reports`, `invite_codes` |
| Perfil público (`/u/[username]`)   | `profiles`, `watched`, `favorite`, `pending_sync`, `lists`/`list_items` (públicas) |
| Mi cuenta → Logros                 | `user_achievements`, `user_share_events`, `watched` (incluida `tmdb_vote_average`), `follows`/`friend_requests` (contadores), `lists`, `recommendations` |

Ver también `docs/PRD.md`, `docs/DECISIONS.md` (o la política de
privacidad en `/privacidad`) para qué se le cuenta al usuario sobre
estos datos.
