# Base de datos

La Butaca Secreta no tiene backend propio para servir recomendaciones
(eso sigue siendo lógica adaptativa + TMDb, ver `CONVERSATION_ENGINE.md`
y `RECOMMENDATION_ENGINE.md`). Lo que sí hay es una base de datos
**Supabase** (PostgreSQL + Auth + Row Level Security) para la parte
opcional de cuenta de usuario: entrar con un enlace mágico por correo,
y guardar el diario, la favorita y las listas de cada persona entre
dispositivos.

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

## Seguridad (RLS)

Las cuatro tablas tienen **Row Level Security** activada, con
políticas que limitan cada operación a `auth.uid() = user_id` (o, en
`list_items`, a que la lista a la que pertenece la fila sea del
usuario, vía un `exists (select … from lists …)`). Nadie puede leer
ni escribir filas de otra cuenta, ni siquiera a través de la propia
API de Supabase: la seguridad vive en la base de datos, no solo en el
cliente.

## Dónde se usa cada tabla

| Pantalla                          | Tablas                        |
| ---------------------------------- | ------------------------------ |
| Mi cuenta → Perfil (Mi Resumen)    | `watched`, `favorite`, `my_month_rank()` |
| Mi cuenta → Diario                 | `watched`                     |
| Mi cuenta → Listas                 | `lists`, `list_items`         |
| Mi cuenta → Pendientes             | Ninguna — es `localStorage` (`lib/watchlist.ts`), por dispositivo, no por cuenta |

Ver también `docs/PRD.md` (o la política de privacidad en
`/privacidad`) para qué se le cuenta al usuario sobre estos datos.
