# Arquitectura

Visión técnica rápida del proyecto. Para el porqué de las decisiones
de producto, ver `PRD.md`, `PHILOSOPHY.md` y `PRINCIPLES.md`; para el
esquema de datos, `DATABASE.md`; para las rutas internas, `API.md`.

## Stack

- **Next.js 16 (App Router)** + React 19 + TypeScript, desplegado en
  **Vercel** (hosting, cron, variables de entorno, Speed Insights).
- **Tailwind CSS v4** para todos los estilos; no hay CSS-in-JS ni
  librería de componentes externa.
- **TMDb** como fuente principal de datos de películas/series y
  disponibilidad por plataforma; **TVmaze** como segunda fuente para
  estrenos de episodios de series (calendario).
- **Supabase** (PostgreSQL + Auth + Row Level Security) para la parte
  opcional de cuenta: login por enlace mágico, diario, favorita y
  listas (ver `DATABASE.md`).
- **Sin IA generativa ni LLM**: el motor de preguntas es lógica
  adaptativa propia (`CONVERSATION_ENGINE.md`), y el motor de
  recomendación es un sistema de puntuación sobre los resultados de
  TMDb (`RECOMMENDATION_ENGINE.md`), no un modelo de lenguaje.

## Cómo encajan las piezas

```
Persona → Conversación (lib/conversation) → perfil de preferencias
        → GET /api/tmdb (lib/recommendation) → consulta TMDb
        → 3 recomendaciones puntuadas y filtradas por plataforma
```

- `lib/conversation/`: motor de preguntas (qué preguntar a
  continuación según lo ya respondido). No sabe nada de TMDb.
- `lib/recommendation/`: motor de puntuación (candidatos de TMDb →
  puntuación → selección de 3, con razón de cada recomendación).
- `lib/tmdb/`: cliente de la API de TMDb y mapeo a los tipos propios
  de la app (`Recommendation`, con póster ya resuelto a URL
  completa).
- `lib/supabase/`: acceso a Supabase desde el cliente (`"use client"`
  en cada archivo), un fichero por tabla/dominio (`watched.ts`,
  `lists.ts`…). Sin capa de API propia en medio: el cliente habla
  directo con Supabase, protegido por RLS.

## Estructura de carpetas

```
app/            Rutas (App Router). Cada página importa un componente
                "screen" de components/ y le pone metadata SEO.
components/     Un subdirectorio por área: conversation, account,
                summary, recommendations, calendar, search, list,
                title, actor, catalog, group, layout.
lib/            Lógica sin JSX: conversación, recomendación, tmdb,
                supabase, analítica, utilidades (rating, watchlist,
                rejected, viewed…).
hooks/          Hooks de React compartidos (useAuth, useWatchlist,
                useDialog, useRecommendations…).
supabase/       Migraciones SQL, pensadas para pegar en el SQL
                Editor de Supabase (ver DATABASE.md).
docs/           Esta carpeta.
e2e/ y tests/   Playwright (end-to-end) y tests unitarios (node --test).
```

## Rutas principales (`app/`)

| Ruta                              | Qué es                                                  |
| ----------------------------------- | ---------------------------------------------------------- |
| `/`                                 | Conversación / recomendador (pestañas: Recomendador, Calendario, Buscar) |
| `/hoy`                              | Variante de aterrizaje ("qué ver hoy")                   |
| `/buscar`                           | Página de búsqueda standalone                           |
| `/pelicula/[id]`, `/serie/[id]`     | Ficha de un título                                       |
| `/actor/[id]`                       | Ficha de una persona (reparto)                            |
| `/pelis/[genero]/[plataforma]`, `/series/[genero]/[plataforma]` | Listados SEO por género y plataforma |
| `/mi-cuenta`                        | Perfil, Diario, Listas y Pendientes en pestañas (ver abajo) |
| `/mi-resumen`                       | Versión anterior de "Mi cuenta", solo el perfil; ya no enlazada desde el footer pero sigue activa |
| `/entrar`                           | Login por enlace mágico (Supabase)                       |
| `/r/[code]`                         | Recomendación compartida (enlace de "Compartir")          |
| `/privacidad`, `/aviso-legal`       | Páginas legales                                          |

`/mi-cuenta` (`components/account/AccountScreen.tsx`) reutiliza
`MiResumenScreen` para la pestaña Perfil, y añade Diario
(`DiaryTab`), Listas (`ListsTab` + `ListDetailDialog` +
`TitlePickerDialog`) y Pendientes (`PendingTab`, que reutiliza
`useWatchlist`, el mismo hook que "Mi lista"). `RequireAccount`
centraliza los tres estados de guarda (login no configurado /
cargando / sin sesión) para las pestañas que necesitan cuenta.

## Dónde vive cada dato

| Dato                                   | Dónde                          | Por cuenta o por dispositivo |
| ---------------------------------------- | -------------------------------- | ------------------------------ |
| Diario, favorita, listas                 | Supabase (`watched`, `favorite`, `lists`/`list_items`) | Por cuenta, sincronizado |
| "Mi lista" / pendientes                  | `localStorage` (`lib/watchlist.ts`) | Por dispositivo |
| Títulos ya vistos (para no repetirlos)   | `localStorage` (`lib/viewed.ts`) | Por dispositivo |
| Títulos ya mostrados en esta sesión      | `localStorage` (`lib/shown.ts`) | Por dispositivo |
| Afinidad de géneros (qué gusta/no gusta) | `localStorage` (`lib/genreAffinity.ts`) | Por dispositivo |
| Títulos descartados ("No me apetece")    | `localStorage` (`lib/rejected.ts`) | Por dispositivo |

Nota: por eso "Mi Resumen"/"Mi cuenta" puede mostrar a la vez datos
de cuenta (diario) y datos de dispositivo (pendientes, descartadas)
— son dos almacenes distintos, no todo pasa por Supabase.

## CI/CD

`.github/workflows/ci.yml` tiene dos jobs sobre cada push:

- **`checks`**: `npm run typecheck` + `npm test` (bloqueante; lint es
  `continue-on-error`). Es la comprobación real de que el código
  compila y los tests unitarios pasan.
- **`e2e`**: `npm run build` + Playwright. Tiene un fallo conocido y
  no relacionado con el código en el paso "Instalar el navegador"
  (entorno de CI, no la app), así que no bloquea los despliegues.

Vercel despliega automáticamente cada push a `main` a producción
(`labutacasecreta.vercel.app`).

## Límites conocidos

- Sin backend propio para la conversación/recomendación: toda la
  lógica corre en rutas de Next.js (`app/api/*`), sin servidor
  separado ni cola de trabajos.
- Sin borrado de cuenta con un botón propio todavía: se pide por
  correo (ver `/privacidad`).
- `npm run typecheck` no es fiable en todos los entornos de
  desarrollo (puede faltar algún paquete de tipos según cómo se
  instalen las dependencias); la validación real de tipos viene del
  job `checks` de CI, que sí instala todo.
