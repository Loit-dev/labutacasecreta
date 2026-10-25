# API interna

Rutas de `app/api/*`. Son internas a la propia web (las usa el
frontend, no están pensadas como API pública): no requieren
autenticación salvo donde se indica, y casi todas aplican límite de
peticiones por IP (`lib/rateLimit.ts`) para no agotar la cuota de
TMDb. Todas devuelven JSON salvo `/api/poster`.

## `GET /api/tmdb`

El motor de recomendación (`lib/recommendation/engine.ts` +
`lib/recommendation/*`). Recibe el perfil que ha ido construyendo la
conversación y devuelve hasta 3 recomendaciones puntuadas.

Parámetros principales (todos opcionales salvo donde se indica):

| Parámetro        | Qué es                                                        |
| ----------------- | -------------------------------------------------------------- |
| `type`            | `movie` \| `tv`                                                |
| `mood`            | Estado de ánimo elegido en la conversación                    |
| `preferredGenre`  | Género preferido                                                |
| `company`         | Con quién la va a ver (`solo`, `pareja`…)                      |
| `duration`        | Preferencia de duración                                        |
| `pace`            | Ritmo preferido                                                 |
| `freshness`       | Estreno reciente vs. clásico                                   |
| `language`        | Idioma original                                                 |
| `animation`       | Incluir animación sí/no                                        |
| `platforms`       | Plataformas marcadas (Netflix, Prime Video, Disney+, Max, Filmin) |
| `exclude`         | Lista de ids de TMDb a excluir (ya vistos / ya mostrados)      |
| `avoid`           | Géneros a penalizar (de títulos rechazados o mal valorados)    |
| `boost`           | Géneros a priorizar (de títulos bien valorados)                |
| `quick`           | `1` para "Butaca Exprés" (menos candidatos, respuesta más rápida) |

Límite: 20 peticiones/minuto por IP. Devuelve `400` si el perfil no
es válido, `[]` si no encuentra candidatos.

## `GET /api/trending`

"Lo más visto": recomendaciones a partir de lo que está en tendencia
en TMDb, filtrado por plataforma.

| Parámetro   | Qué es                                   |
| ----------- | ------------------------------------------ |
| `platforms` | Plataformas marcadas, igual que en `/api/tmdb` |

Revisa hasta 2 páginas de tendencias (`PAGES`) y hasta 15 candidatos
(`MAX_CHECKED`), comprobando disponibilidad y detalles con 8
peticiones en paralelo (`CONCURRENCY`). `maxDuration = 20`.

## `GET /api/calendar`

Estrenos del mes para el calendario (`CalendarView`), combinando TMDb
(estrenos en cines/streaming) y TVmaze (estrenos de episodios de
series) — ver `lib/calendar.ts`.

| Parámetro | Qué es                              |
| --------- | -------------------------------------- |
| `month`   | Mes a consultar (`parseMonth`); por defecto, el actual |

## `GET /api/search`

Buscador de títulos por texto (el cuadro "¿Qué película o serie
buscas?" y el buscador de "Añadir título" en las listas de Mi
cuenta). Envuelve `searchMulti` de TMDb.

| Parámetro | Qué es                                   |
| --------- | -------------------------------------------- |
| `q`       | Texto de búsqueda; menos de 3 letras devuelve `[]` sin consultar a TMDb |

Límite: 30 peticiones/minuto por IP. Como mucho 8 resultados
(`RESULTS_LIMIT`).

## `GET /api/resumen-title`

Ficha completa de un título por id, para "Mi Resumen" / el diario: la
tabla `watched` solo guarda título, nota y géneros (ver
`docs/DATABASE.md`), así que la última vista, la mejor valorada y la
favorita piden aquí el resto (póster, sinopsis, año, duración,
plataformas…) para mostrarse con el mismo formato de tarjeta que el
resto de la web.

Límite: 30 peticiones/minuto por IP.

## `GET /api/poster`

Sirve un póster de TMDb desde el propio dominio
(`image.tmdb.org/t/p/w500<path>`), para que el botón "Compartir"
pueda dibujarlo en un `<canvas>` sin que el navegador lo bloquee por
CORS (todas las imágenes de un canvas que se vaya a exportar deben
venir del mismo origen). Solo se usa para esa imagen; el resto de
pósters de la web cargan directamente desde `image.tmdb.org`.

| Parámetro | Qué es                                            |
| --------- | --------------------------------------------------- |
| `p`       | Ruta del póster (`/xxxxx.jpg`); se valida contra `POSTER_PATH` antes de pedirla a TMDb |

## `GET /api/conversation`

Comprobación de salud (`{ status: "ok" }`), sin lógica propia.

## Lo que NO pasa por una API propia

- **Cuenta, diario, favorita y listas**: el cliente habla
  directamente con Supabase (`lib/supabase/*.ts`), protegido por Row
  Level Security — no hay rutas `/api/*` de por medio (ver
  `docs/DATABASE.md`).
- **"Mi lista" / pendientes**: vive solo en `localStorage`
  (`lib/watchlist.ts`), no hay servidor implicado.
