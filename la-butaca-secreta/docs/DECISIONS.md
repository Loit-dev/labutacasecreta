# Decisiones técnicas

Registro de decisiones concretas y su porqué, para no tener que
redescubrirlo cada vez. No es un historial completo del proyecto
(eso está en el log de git); son los casos donde "por qué se hizo
así y no de otra forma" no es obvio solo con leer el código.

Formato: fecha aproximada, decisión, alternativa descartada, porqué.

---

## Motor de conversación y de recomendación sin LLM

**Decisión**: el motor de preguntas (`lib/conversation/`) y el de
recomendación (`lib/recommendation/`) son lógica propia determinista
(reglas + puntuación), no un modelo de lenguaje.

**Detalle**: ver `CONVERSATION_ENGINE.md` y
`RECOMMENDATION_ENGINE.md` para cómo funcionan. El README lo declara
explícitamente en el stack ("Sin IA generativa… no un LLM").

---

## Cuenta de usuario: Supabase, no una API propia

**Decisión**: el login (enlace mágico) y los datos ligados a cuenta
(diario, favorita, listas) usan Supabase (PostgreSQL + Auth + Row
Level Security) directamente desde el cliente, sin rutas `/api/*`
propias de por medio.

**Alternativa descartada**: una API propia en `app/api/*` que hablara
con una base de datos por detrás, como ya existe para TMDb.

**Porqué**: con RLS, la seguridad ("cada cuenta solo ve y toca sus
propias filas") vive en la base de datos, no hay que reimplementarla
en cada endpoint, y Supabase ya resuelve login + sesión + base de
datos en un único servicio. El coste es confiar en que las políticas
RLS estén bien escritas (ver la siguiente entrada).

---

## `list_items` necesita política de UPDATE, no solo INSERT

**Fecha**: esta conversación (añadiendo la pestaña Listas a Mi
cuenta).

**Qué pasó**: `addListItem` usa `.upsert(...)` (inserta, o actualiza
si ya existe, según `onConflict`). Con RLS activado, Postgres exige
permiso de **actualizar** la tabla para poder ejecutar cualquier
`INSERT … ON CONFLICT DO UPDATE`, incluso en el caso normal donde no
hay conflicto y se inserta de cero. La migración inicial solo traía
políticas de SELECT/INSERT/DELETE, así que añadir cualquier título a
una lista fallaba en silencio (el error quedaba atrapado en el
`try/catch` y solo se veía en la consola).

**Decisión**: añadir también una política de UPDATE con el mismo
criterio (`exists (select … from lists where … user_id = auth.uid())`)
cada vez que una tabla con RLS vaya a recibir un `upsert()`, no solo
un `insert()`.

**Dónde**: `supabase/lists.sql`, documentado también en
`DATABASE.md`.

---

## Pósters: URL completa en la base de datos, no solo el `path` de TMDb

**Decisión**: `watched.poster_url` y `list_items.poster_url` guardan
la URL completa de `image.tmdb.org`, no solo el `poster_path` corto
que da la API de TMDb.

**Porqué**: evita tener que reconstruir la URL (y depender de que el
tamaño/formato de imagen no cambie) cada vez que se lee la fila; a
cambio, si TMDb cambiara su dominio de imágenes algún día, haría
falta una migración de datos en vez de solo un cambio de código. Se
aceptó el trade-off por simplicidad.

---

## `/api/poster` es solo para la imagen de "Compartir", no para pósters normales

**Decisión**: los pósters que se ven en pantalla (tarjetas,
diario, listas, Mi Resumen) cargan la URL de `image.tmdb.org`
directamente en `<Image>`; no pasan por `/api/poster`.

**Alternativa descartada (y corregida en esta conversación)**: usar
`posterSource()` (que envuelve la imagen en `/api/poster?p=...`)
también para pósters en pantalla, por similitud superficial con
`MiResumenScreen.tsx`.

**Porqué**: `/api/poster` existe únicamente para evitar que un
`<canvas>` quede "contaminado" por CORS al generar la imagen de
"Compartir" (todas las imágenes de un canvas exportable deben venir
del mismo origen). Para una `<Image>` normal en pantalla es
indirección innecesaria: `next.config.ts` ya declara
`image.tmdb.org` en `images.remotePatterns`, así que la carga directa
funciona y es más simple.

---

## El job `e2e` de CI no bloquea el despliegue

**Decisión**: un fallo del job `e2e` (Playwright) en el paso
"Instalar el navegador" se considera un problema del entorno de CI,
no del código, y no impide dar un cambio por bueno. El job que sí
valida cada cambio es `checks` (`npm run typecheck` + `npm test`).

**Porqué**: el fallo es constante, ocurre antes de que `e2e` llegue
siquiera a construir la web (`npm run build`) o a ejecutar un solo
test, y nunca se ha correlacionado con ningún cambio real a lo largo
de muchos commits. Sigue abierto en `ROADMAP.md` arreglarlo de raíz
para que vuelva a aportar una señal útil.
