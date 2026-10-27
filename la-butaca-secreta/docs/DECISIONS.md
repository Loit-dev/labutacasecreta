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

## La medalla de "Este mes" compara con meses anteriores, no un umbral fijo

**Fecha**: esta conversación.

**Qué pasó**: `monthBadgeFor()` daba la medalla según un umbral fijo de
títulos vistos en el mes (🥇 ≥15, 🥈 ≥8, 🥉 ≥3), sin relación con el
resto de estadísticas de la pantalla. Un usuario con solo 5 vistas en
el mes —pero que era su mes con más vistas hasta la fecha— veía 🥉 y
le resultó confuso: "Este mes" coincidía con "Totales" (ambos 5) y
esperaba la medalla de oro, no la de bronce.

**Decisión**: `monthBadgeFor()` ahora compara el mes actual con el
propio historial de meses anteriores del usuario (recibe
`previousMonthCount` y el mapa `priorMonthCounts` ya calculados en
`buildSummary`): 🥇 si iguala o supera el mejor mes anterior, 🥈 si
mejora o iguala el mes pasado sin ser el mejor de todos, 🥉 para
cualquier otro mes con algo visto. Un primer mes sin historial previo
con el que comparar ya es 🥉.

**Alternativa descartada**: bajar los umbrales fijos (p. ej. 🥇 ≥10)
— no resuelve el problema de fondo, que es comparar un número
absoluto en vez de relativo al propio historial.

**Dónde**: `lib/summary.ts`.

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

---

## El cuestionario "Solo" ya no se salta preguntas por memoria

**Fecha**: 26 oct 2026.

**Qué pasó**: `useConversation.ts` usaba `confidentDefaults()`
(`lib/memory.ts`, basada en `localStorage`) para preguntar en silencio
el género o el ánimo cuando ya se habían repetido en visitas
anteriores. Efecto secundario detectado en auditoría: la barra de
progreso podía arrancar ya a mitad (53%) sin que nada en pantalla
explicara por qué, y parecía un fallo.

**Decisión**: quitar ese salto por completo. El cuestionario "Solo"
siempre pregunta contenido, ánimo, género, modo de descubrimiento,
frescura y restricciones; lo único preseleccionado sigue siendo
"¿con quién vas?" (ya respondido al elegir "Solo" en la pantalla
anterior, no es una suposición sobre gustos).

**Alternativa descartada**: mantener el salto pero avisar con un
mensaje del bot explicando por qué se adelantaba la barra de
progreso. Se implementó primero así, pero el usuario pidió
directamente no saltarse ninguna pregunta: lo que apetece ver cambia
de un día para otro, y asumir que siempre es el mismo género no es
correcto aunque se avise.

**Dónde**: `hooks/useConversation.ts`. `lib/memory.ts` no se tocó:
sigue alimentando `inferredProfile()`, que usa Butaca Exprés (ahí sí
es intencional no preguntar nada).

---

## Calendario: datos de hoy precargados en el servidor + caché avisada

**Fecha**: 26 oct 2026.

**Qué pasó**: la pestaña Calendario pedía siempre los datos al
navegador al abrirse. La ruta (`app/api/calendar`) puede tardar hasta
el límite de `maxDuration` (60s) la primera vez que se pide un mes
(compara contra TMDb y TVmaze), y si tardaba o fallaba la interfaz se
quedaba en "Buscando estrenos…" sin ningún aviso ni forma de
reintentar.

**Decisión**: tres cambios complementarios, no uno solo:
1. `app/page.tsx` trae los datos del mes actual en el servidor
   (mismo `revalidate` de 3600s que ya usaba el `Cache-Control` de la
   ruta) y se los pasa a `CalendarView` ya listos, así el caso más
   común (abrir la app y ver "hoy") no depende de ninguna petición
   desde el navegador.
2. `CalendarView.tsx`: aviso de "esto está tardando más de lo
   normal" a los 6s, y a los 25s se da la carga por fallida con un
   botón "Reintentar" (antes no había forma de reintentar sin
   recargar la página entera).
3. Tarea programada por hora que pide el mes actual y el siguiente
   solo para mantener caliente la caché de Vercel y que a un
   visitante real casi nunca le toque una carga en frío.

**Alternativa descartada**: bajar `maxDuration` o simplificar la
consulta a TMDb/TVmaze para que sea más rápida de raíz. Se descartó
por ahora: cambia la cobertura/exactitud del calendario, que es un
problema distinto al de la experiencia de carga.

**Dónde**: `app/page.tsx`, `components/calendar/CalendarView.tsx`.

---

## Buscador: se filtra por relevancia real del título, no solo por el orden de TMDb

**Fecha**: 26 oct 2026.

**Qué pasó**: `/api/search` usaba directamente el orden de
`/search/multi` de TMDb, que pondera por popularidad. Con consultas
cortas o de títulos muy populares, colaba algún resultado sin
relación real (p. ej. buscar «Dune» devolvía «Anatomía de una caída»
entre los ocho resultados).

**Decisión**: después de pedir a TMDb, quedarse solo con los
resultados cuyo título (en cualquier idioma: `title`/`name`/
`original_title`/`original_name`, sin acentos) contiene lo escrito.
Si ninguno lo contiene (típico de erratas o títulos muy traducidos),
se deja el orden original de TMDb tal cual, para no devolver una
lista vacía por ser demasiado estrictos.

**Alternativa descartada**: una distancia de edición (Levenshtein) u
otra heurística de similitud más compleja. Se descartó por ahora: el
filtro por "contiene la cadena" resuelve el caso real detectado sin
añadir una dependencia ni lógica que haya que mantener.

**Dónde**: `app/api/search/route.ts`.

---

## Tres mejoras visuales: inicio, tarjeta de recomendación y calendario

**Fecha**: 26 oct 2026.

**Qué pasó**: a partir de tres mockups (pedidos para ver cómo podría
mejorarse la apariencia de la web), se llevaron a código los tres
cambios, sin tocar ninguna lógica ni contrato de props existente:

1. **Inicio más visual** (`components/conversation/ModeSelect.tsx`):
   los emoji de Solo/Acompañado/Butaca Exprés se sustituyen por iconos
   SVG propios en una insignia de color, con una flecha al final de
   cada tarjeta.
2. **Tarjeta de recomendación enriquecida**
   (`components/recommendations/RecommendationCard.tsx`): la nota
   (⭐) pasa a una insignia sobre el póster en vez de ir en el texto, y
   los botones «Guardar» / «Ya la vi» / «No me apetece» pasan de texto
   con emoji a icono + etiqueta apilados. Sin cambios en `Props`: los
   8 sitios que usan esta tarjeta (`Recommendations`, `QuickPicks`,
   `FavoriteCard`, `SummaryTitleCard`, `SharedRecommendations`,
   `CatalogGrid`...) no se han tocado.
3. **Calendario con pósters** (`components/calendar/CalendarView.tsx`):
   tira horizontal «Próximos estrenos» con miniatura de póster por
   día (calculada sobre el mes ya cargado, sin pedir ningún dato
   nuevo), y los días de la cuadrícula con estreno muestran el póster
   de fondo en vez de solo los logos de plataforma.

**Alternativa descartada**: para el calendario, pedir también el mes
siguiente para alimentar "Próximos estrenos" a final de mes.
Descartado por ahora para no añadir una petición de red adicional al
cargar la página (ver la entrada de arriba, "datos de hoy
precargados..."): la tira solo usa lo que ya está en memoria y puede
quedar vacía los últimos días del mes.

**Dónde**: `components/conversation/ModeSelect.tsx`,
`components/recommendations/RecommendationCard.tsx`,
`components/calendar/CalendarView.tsx`.

---

## Dirección visual más atrevida: "entrada de cine" en Inicio y tarjeta

**Fecha**: 26 oct 2026.

**Qué pasó**: tras la entrada anterior, se pidió explícitamente ir más
lejos visualmente, aprovechando el nombre "La Butaca Secreta": una
estética de entrada de cine / sala secreta (bordes discontinuos tipo
ticket, acento dorado de marquesina junto al rojo, separador tipo
"cupón rasgado").

**Decisión**: `ModeSelect.tsx` y `RecommendationCard.tsx` pasan a
`rounded-md`/`rounded-lg` con borde discontinuo (`border-dashed`) en
vez de `rounded-2xl`/`rounded-3xl` con borde sólido; los iconos del
selector de modo pasan de rosa/naranja a dorado (`#facc15`), que ya se
usaba en el resto de la web para nota y "guardado"; se añade un
separador de "perforación" (`repeating-linear-gradient`) entre el
póster y el contenido de la tarjeta, y bajo el selector de modo; el
titular de Inicio (`Header.tsx`) lleva ahora un degradado
ámbar→rojo en vez de solo rojo/naranja. Los títulos de los botones de
modo y "Ver detalles" pasan a mayúsculas con tracking ancho.

**Alternativa descartada**: añadir una tercera familia tipográfica
(p. ej. una fuente condensada estilo "marquesina de cine") para
reforzar el efecto. Descartada porque `BRAND.md` fija explícitamente
solo dos familias (Geist/Manrope) y dice que un componente con más
carácter usa `.title-font` (Manrope), no una fuente nueva; el efecto
"marquesina" se consigue con Manrope en mayúsculas, extra-bold y
tracking ancho, sin romper esa regla.

**Nota pendiente**: `BRAND.md` dice que la iconografía de pestañas y
navegación es emoji, y que el SVG a medida es solo para marcas de
terceros/iconos "serios". El selector de modo (`ModeSelect.tsx`) usa
SVG a medida desde la entrada anterior, lo cual es una excepción
deliberada a esa regla para esta pantalla concreta (no para las
pestañas Recomendador/Calendario/Buscar, que siguen en emoji). Queda
pendiente decidir si se documenta como excepción permanente en
`BRAND.md` o se revierte a emoji.

**Dónde**: `components/conversation/ModeSelect.tsx`,
`components/conversation/Header.tsx`,
`components/recommendations/RecommendationCard.tsx`.

---

**Fecha**: 26 oct 2026.

**Qué pasó**: tras ver el mockup "Inicio — entrada de cine" (ticket
rasgado, tipografía Bebas Neue en mayúsculas), se pidió explícitamente
usar esa tipografía real en el sitio y dar cohesión visual completa a
toda la web con el enfoque "entrada de cine" — en particular la barra
de pestañas, que no encajaba con el resto.

**Decisión**: se añade **Bebas Neue** como tercera familia tipográfica
(`--font-marquee` en `app/layout.tsx`, clase `.marquee-font` en
`globals.css`), reservada a titulares grandes y rótulos cortos de UI
(nunca texto de lectura). Esto revierte la decisión de la entrada
anterior de simular el efecto "marquesina" solo con Manrope en
mayúsculas — el usuario confirmó que quería la tipografía real del
mockup, no la simulación. Se aplica en: `Header.tsx` (titular "Tu
sesión / empieza aquí.", con la bajada "Elige tu entrada. Nosotros
apagamos las luces."); `ModeSelect.tsx` (título "¿Cómo vas a verla?",
botones renombrados a "Butaca 1 · Solo" / "Butacas · Acompañado" /
"Pase Exprés", y nueva nota "Sin IA generativa — recomendaciones por
reglas propias" bajo la perforación); la barra de pestañas y el enlace
de cuenta en `Conversation.tsx`/`AccountTabLink.tsx` (borde discontinuo
dorado en vez de rojo sólido, etiquetas en `.marquee-font`); las
etiquetas cortas de `RecommendationCard.tsx` (badge, "Ver detalles",
Guardar/Ya la vi/No me apetece); y los titulares y botones de
navegación de `CalendarView.tsx` ("Calendario de estrenos", el mes,
"Próximos estrenos", el título del día). El texto de lectura (sinopsis,
pistas, hints descriptivos) se queda en Geist/Manrope sin cambios.

**Alternativa descartada**: la entrada anterior había descartado una
tercera familia por la regla de `BRAND.md`. Esa regla se actualiza
aquí explícitamente — ya no aplica — en vez de quedar en contradicción
con el código.

**Dónde**: `app/layout.tsx`, `app/globals.css`,
`components/conversation/Header.tsx`,
`components/conversation/ModeSelect.tsx`,
`components/conversation/PlatformPicker.tsx`,
`components/conversation/Conversation.tsx`,
`components/layout/AccountTabLink.tsx`,
`components/recommendations/RecommendationCard.tsx`,
`components/calendar/CalendarView.tsx`, `docs/BRAND.md`.

---

**Fecha**: 26 oct 2026.

**Qué pasó**: viendo el resultado de la entrada anterior, se pidió
explícitamente extender el estilo de icono SVG dorado del selector de
modo (`ModeSelect.tsx`) a la barra de pestañas y a los botones de
acción de la tarjeta de recomendación.

**Decisión**: se crean iconos SVG propios para Recomendador, Calendario
y Buscar (`components/conversation/TabIcons.tsx`, trazo `#facc15`,
mismo lenguaje visual que `SoloIcon`/`GroupIcon`), sustituyendo los
emoji 🎬📅🔎 de la barra de pestañas; el icono de cuenta
(`AccountTabLink.tsx`) pasa a usar el mismo `AccountIcon` compartido
en vez de un SVG duplicado en blanco. En `RecommendationCard.tsx`, los
iconos de Guardar/Ya la vi/No me apetece se envuelven en un anillo
circular (`rounded-full border`, color a juego con cada acción: dorado
para guardado, verde esmeralda para "ya la vi", gris para "no me
apetece"), igual que los iconos grandes del selector de modo. Esto
resuelve la "nota pendiente" de la entrada del 26 oct sobre SVG vs.
emoji: a partir de ahora el SVG a medida es el estándar para pestañas
y botones de acción; el emoji queda solo para listas/pantallas fuera
de esa navegación principal. `BRAND.md` se actualiza en consecuencia.

**Dónde**: `components/conversation/TabIcons.tsx` (nuevo),
`components/conversation/Conversation.tsx`,
`components/layout/AccountTabLink.tsx`,
`components/recommendations/RecommendationCard.tsx`, `docs/BRAND.md`.

---

**Fecha**: 26 oct 2026.

**Qué pasó**: tras llevar a producción la cohesión visual general, se
pidió extender el mismo enfoque al apartado "Mi cuenta" (perfil,
diario, listas, pendientes) y a la pantalla de login, que se habían
quedado con el estilo antiguo (emoji, Manrope, bordes sólidos).

**Decisión**: la barra de pestañas de `AccountScreen.tsx` pasa a usar
el mismo patrón que la barra principal (`Conversation.tsx`): borde
inferior discontinuo dorado en la pestaña activa, etiquetas en
`.marquee-font`, e iconos SVG propios nuevos (`DiaryIcon`, `ListsIcon`,
`PendingIcon` en `TabIcons.tsx`, reutilizando `AccountIcon` para
"Perfil"). Dentro de cada pestaña: la cabecera de mes del diario, el
botón "Crear" de listas y el botón "Quitar" de pendientes pasan a
`.marquee-font`. El titular de "Mi Resumen" (`MiResumenScreen.tsx`)
también pasa a `.marquee-font` (frases cortas, encajan bien). En la
pantalla de login (`app/entrar/`), el titular y el botón "Continuar
con Google" (ahora con borde discontinuo dorado, a juego con el resto
de botones "ticket") y "Enviarme el enlace mágico" pasan a
`.marquee-font`.

**Dónde**: `components/account/AccountScreen.tsx`,
`components/account/DiaryTab.tsx`, `components/account/ListsTab.tsx`,
`components/account/PendingTab.tsx`, `components/conversation/
TabIcons.tsx`, `components/summary/MiResumenScreen.tsx`,
`app/entrar/page.tsx`, `app/entrar/LoginForm.tsx`.

---

**Fecha**: 26 oct 2026.

**Qué pasó**: se pidió aplicar el formato "entrada de cine" a toda la
web (no solo a Inicio, tarjetas, calendario, pestañas y Mi cuenta) y,
si hacía falta, a las imágenes que se generan para compartir/Instagram.

**Decisión**: barrido de cohesión por el resto de pantallas: tarjetas
de opción del cuestionario (`AnswerButton.tsx`, borde discontinuo
dorado como ModeSelect), cabeceras y botón "Empezar" del modo
Acompañado (`Panel.tsx`, `GroupQuiz.tsx`), el diálogo "¿Qué te
pareció?" (`RatingPrompt.tsx`), el diálogo de compartir
(`ShareDialog.tsx`), la ficha de detalles (`DetailsModal.tsx`:
cabeceras de sección, badge, botones de acción), "Butaca Exprés" y sus
botones (`QuickPicks.tsx`), la página de enlace compartido
(`app/r/[code]/page.tsx`, `SharedRecommendations.tsx`), la página 404
(`app/not-found.tsx`) y las páginas de Privacidad/Aviso legal
(`components/layout/LegalPage.tsx`: titular y enlace "Volver", el
cuerpo del texto legal se queda en Geist por legibilidad). Todo pasa a
`.marquee-font` en titulares/botones/etiquetas cortas, igual que el
resto de la web; el texto de lectura (sinopsis, reparto, cuerpo legal)
no cambia.

**Dónde**: `app/not-found.tsx`, `app/r/[code]/page.tsx`,
`components/conversation/AnswerButton.tsx`, `components/group/
GroupQuiz.tsx`, `components/group/Panel.tsx`, `components/layout/
LegalPage.tsx`, `components/recommendations/DetailsModal.tsx`,
`components/recommendations/QuickPicks.tsx`,
`components/recommendations/RatingPrompt.tsx`,
`components/recommendations/ShareDialog.tsx`,
`components/recommendations/SharedRecommendations.tsx`.

---

## 2026-10 · Fecha elegible al marcar "Ya la vi"

**Decisión**: al marcar un título como visto (`RatingPrompt.tsx`, en
el flujo normal, no al editar una nota ya puesta desde el diario), se
puede elegir la fecha en la que se vio con un `<input type="date">`,
con el día de hoy por defecto y sin permitir fechas futuras (`max`).
Se guarda en `watched.seen_at` tal cual (la columna ya era
`timestamptz` libre, sin cambios de esquema).

**Por qué el mediodía local y no medianoche**: `lib/dateInput.ts`
convierte el `YYYY-MM-DD` del input a ISO usando el mediodía en el
huso horario del navegador (no medianoche UTC), para que un desfase
de huso horario al guardar o releer no cambie el día mostrado en el
diario (`DiaryTab.tsx` agrupa y pinta usando `new Date(seenAt)` en
hora local).

**Por qué no al editar desde el diario**: cambiar solo la nota de una
entrada antigua (`updateWatchedRating`) deliberadamente no toca la
fecha (decisión previa, ver el comentario en
`lib/supabase/watched.ts`); el selector de fecha solo tiene sentido la
primera vez que se marca como vista.

**Dónde**: `lib/dateInput.ts` (nuevo), `components/recommendations/
RatingPrompt.tsx`, `lib/supabase/watched.ts` (`saveWatched` acepta
`seenAt` opcional), `components/recommendations/Recommendations.tsx`,
`components/recommendations/QuickPicks.tsx`,
`components/title/TitleActions.tsx`.

---

## 2026-10 · Toda la portada cambia la favorita; fecha editable desde el diario

**Decisión (favorita)**: en "Mi Resumen", tocar la portada entera de
"Tu favorita" (no solo el pequeño rótulo "Cambiar") abre el selector
de favorita. `RecommendationCard` gana un `onPosterClick` opcional
(botón transparente `absolute inset-0 z-20` sobre el póster, por
encima de la nota y del resto de capas decorativas) que no afecta a
ningún otro uso de la tarjeta porque nadie más lo pasa. El rótulo
"Cambiar" se queda como pista visual (`pointer-events-none`, ya no es
un `<button>` aparte) para no duplicar la acción.

**Decisión (fecha en el diario)**: en el diario de Mi cuenta, tocar la
fecha (día/mes) de una entrada abre `EditSeenDateDialog` para
corregirla; al guardar, se llama a la nueva `updateWatchedSeenAt`
(`lib/supabase/watched.ts`) y el array local `rows` se reordena entero
por `seenAt` descendente, no solo esa fila, porque el agrupado por mes
de `DiaryTab.tsx` dan por hecho que las filas ya vienen ordenadas de
más reciente a más antigua.

**Dónde**: `components/recommendations/RecommendationCard.tsx`
(`onPosterClick`, `posterClickLabel`), `components/summary/
SummaryTitleCard.tsx`, `components/summary/MiResumenScreen.tsx`,
`components/account/EditSeenDateDialog.tsx` (nuevo),
`components/account/DiaryTab.tsx`, `lib/supabase/watched.ts`
(`updateWatchedSeenAt`), `lib/dateInput.ts` (`isoToDateInput`).

---

## 2026-10 · Barrido de emojis → iconos SVG (estilo "entrada de cine")

**Decisión**: sustituir los emojis "funcionales" (🎬📺🔥⭐🏆👁📌🙅✅
🔖💡🎭⚡📤🔄🥇🥈🥉📲🔎📬) por los mismos iconos SVG de trazo que ya se
usaban en pestañas/botones (`components/conversation/TabIcons.tsx`),
para que toda la interfaz visible comparta un único lenguaje visual
en vez de mezclar emoji de colores con iconos de línea dorada.

**Qué se deja igual (a propósito)**:
- Símbolos tipográficos que ya encajaban con la estética (no son
  emoji de color): `← → ✓ ✕ ★ ✔ ⚠`. Se quedan tal cual en todos los
  sitios donde aparecen (diálogos, calendario, valoración por
  estrellas con `★`, flechas de carrusel...).
- Emoji expresivos/de reacción y los gestos de piedra-papel-tijera en
  `components/group/GroupQuiz.tsx` y `components/group/RpsDuel.tsx`
  (😕😌🤔🙈😂🎉✊✋✌, y también 🗳️/🟢 dentro de esa misma pantalla, para
  no romper la coherencia de ese bloque de microcopy): forzarlos a un
  icono de línea monocromo dorado les quitaría la gracia en un
  contexto de juego/grupo, que es precisamente donde más aportan.
- `components/recommendations/badges.ts`, `lib/summaryImage.ts`,
  `lib/shareImage.ts` y el resto de generadores de imagen por
  `<canvas>`/`next/og`: siguen usando los emoji como datos de texto
  porque dibujan los glifos directamente (`ctx.fillText`) y no pueden
  renderizar un componente React. Las pantallas (no las imágenes
  generadas) pasan por un wrapper nuevo, `components/recommendations/
  BadgeIcon.tsx`, que traduce esos mismos emoji-dato a un icono SVG
  solo en el renderizado en pantalla.
- Datos de `lib/` que no se pintan directamente tal cual (géneros,
  personalidad del cuestionario, nodos de conversación, scoring...)
  se dejan sin tocar por el mismo motivo: son datos, no la pantalla.

**Cómo**: nuevo `components/icons/Icons.tsx` con componentes
`{ size?, className? }` que usan `currentColor`/`stroke="currentColor"`
(a diferencia de los iconos ya existentes en `TabIcons.tsx`, que
llevan el dorado fijo) para poder heredar el color de texto de cada
contexto (botones con fondo rojo, texto blanco, ámbar...).

**Dónde** (iconos nuevos: `ClapperIcon`, `TvIcon`, `FireIcon`,
`StarFilledIcon`, `TrophyIcon`, `EyeIcon`, `PinIcon`, `DiscardIcon`,
`CheckBadgeIcon`, `BookmarkIcon`, `BulbIcon`, `MasksIcon`, `BoltIcon`,
`ShareIcon`, `RefreshIcon`, `MedalIcon`, `SearchIcon`, `PhoneIcon`,
`MailIcon`): `components/recommendations/BadgeIcon.tsx` (nuevo) y, en
el resto de archivos, sustitución del emoji por su icono equivalente
en `components/recommendations/{RecommendationCard,DetailsModal,
RecommendationSkeleton,Recommendations,SharedRecommendations,
QuickPicks}.tsx`, `components/conversation/{AnswerButton,
PlatformPicker,ChatHistory}.tsx`, `components/account/{ListsTab,
DiaryTab}.tsx`, `components/summary/{MiResumenScreen,FavoriteCard}
.tsx`, `components/title/{TitleActions,TitlePageBody}.tsx`,
`components/actor/ActorPageBody.tsx`, `components/catalog/
{CatalogPageBody,CatalogGrid}.tsx`, `components/layout/
InstallButton.tsx`, `components/list/MyListButton.tsx`,
`components/calendar/CalendarView.tsx`, `app/not-found.tsx`,
`app/entrar/{page,LoginForm}.tsx`, `app/buscar/page.tsx`.

**Ampliación — botones de respuesta del cuestionario**: las opciones
del cuestionario (`data/conversation/nodes.ts`) también llevaban
emoji delante de cada texto ("🙋 Solo", "😂 Reírme", "🚀 Ciencia
ficción"...). En vez de tocar `nodes.ts` (son datos, y los reutiliza
el motor de puntuación), se añadió `components/conversation/
AnswerIcon.tsx`: un mapa emoji → icono y una función
`splitAnswerLabel(label)` que separa el emoji inicial del resto del
texto solo para pintarlo. Si un emoji no está en el mapa, se
devuelve el texto completo sin icono (no rompe nada, solo se queda
sin icono) — así una opción nueva en `nodes.ts` no obliga a tocar
este archivo a la vez. `components/conversation/AnswerButton.tsx`
usa esa función en vez de la comprobación manual que tenía antes
para "🎬 Película" / "📺 Serie".

**Dónde**: `components/icons/Icons.tsx` (17 iconos nuevos: `PersonIcon`,
`HeartIcon`, `CheersIcon`, `FamilyIcon`, `LaughIcon`, `TensionIcon`,
`BrainIcon`, `RocketIcon`, `SurpriseIcon`, `DiceIcon`, `GhostIcon`,
`SwirlIcon`, `BanIcon`, `ThumbsUpIcon`, `SparkleIcon`, `LeafIcon`,
`GemIcon`), `components/conversation/AnswerIcon.tsx` (nuevo),
`components/conversation/AnswerButton.tsx`.

**Segunda ampliación — eco del chat, título de pregunta y géneros de
Mi Resumen**: quedaban tres sitios donde el mismo emoji de datos se
colaba sin pasar por un botón: el mensaje que repite en el chat la
opción que acabas de elegir (mismo `label` con emoji), el título de
la pregunta de restricciones ("🚫 Antes de terminar...", el único
título de `nodes.ts` que lleva emoji) y los nombres de género en
"Tus géneros" de Mi Resumen (`lib/genreEmoji.ts`, que da un emoji
por género de TMDb). `components/conversation/AnswerIcon.tsx` se
convirtió en el mapa emoji → icono único para toda la web (fusiona
las opciones del cuestionario y los géneros, que comparten varios
emoji) y expone `emojiIcon(emoji)` además de `splitAnswerLabel`.
`ChatHistory.tsx` usa `splitAnswerLabel` en cada mensaje (de bot o de
usuario) para sustituir el emoji inicial por su icono si lo
reconoce, sin tocar los mensajes de personalidad que no llevan emoji
delante. `MiResumenScreen.tsx` usa `emojiIcon(genreEmoji(nombre))`
para la lista de géneros. 10 iconos nuevos de género (`CompassIcon`,
`PaletteIcon`, `CrimeIcon`, `CameraIcon`, `WizardHatIcon`,
`ScrollIcon`, `MusicNoteIcon`, `SwordsIcon`, `CowboyHatIcon`, y
`SearchIcon` reutilizado para "Misterio").

**Sigue sin tocarse, a propósito**: el texto de personalidad del bot
(`lib/conversation/personality.ts`) lleva emoji sueltos en mitad de
frases completas (no al principio de un texto corto), y
`GroupQuiz.tsx`/`RpsDuel.tsx` siguen fuera del barrido por el motivo
ya explicado arriba (emoji expresivos en un minijuego).

**Dónde**: `components/icons/Icons.tsx` (10 iconos de género),
`components/conversation/AnswerIcon.tsx` (ahora exporta también
`emojiIcon`), `components/conversation/ChatHistory.tsx`,
`components/summary/MiResumenScreen.tsx`.

---

## 2026-10 · Descartadas: ver la lista y poder deshacerlas

**Decisión**: "Descartadas" en Mi Resumen era solo un contador (cuántos
títulos se habían marcado "No me apetece"), sin lista ni forma de
deshacerlo — `lib/rejected.ts` solo guardaba el id, no título ni
póster, así que no había nada que enseñar. Se reescribió para guardar
el mismo tipo de datos que `lib/watchlist.ts` (título, año, nota,
póster) y se añadió `DiscardedDialog.tsx`: al tocar la tarjeta
"Descartadas" se abre un diálogo con la rejilla de pósters y una ✕
encima de cada uno para quitarlo — mismo diseño que
`ListDetailDialog.tsx` (listas personalizadas), que es lo que se pidió
explícitamente ("la x, como dentro de las listas").

**Formato antiguo**: antes se guardaba por separado
(`lbs:rejected:movie` / `lbs:rejected:tv`, solo números). Se cambia a
una única clave `lbs:rejected:v2` con objetos completos; el formato
antiguo se descarta sin más al leerlo (el contador vuelve a 0 la
primera vez que alguien abre esta versión) — es solo una preferencia
local, no datos de cuenta, así que no hay nada que migrar de verdad.

**Dónde**: `lib/rejected.ts` (reescrito, con `RejectedItem`,
`readRejectedList`, `removeRejected`, `REJECTED_EVENT`),
`hooks/useRejected.ts` (nuevo, mismo patrón que `useWatchlist`),
`components/summary/DiscardedDialog.tsx` (nuevo),
`components/summary/MiResumenScreen.tsx` (la tarjeta DESCARTADAS pasa
a ser un botón), `hooks/useRecommendations.ts` y
`components/recommendations/QuickPicks.tsx` (pasan el título/póster/
año al descartar, no solo el id), `tests/rejected.test.ts` (nuevo).

## 2026-10 · Amigos: seguir, amistad, listas compartidas, feed y recomendaciones

Primera versión de la capa social, construida en la rama
`amigos-sociales` a partir del diseño acordado en el documento del
proyecto (`claude/disenio-amigos-sociales.md`). Resumen de las
decisiones de producto, con el detalle técnico de cada una:

- **Seguir** es instantáneo y asimétrico (sin aprobación). **Amistad**
  es solicitud + aceptación mutua, y da acceso extra (p. ej. a listas
  privadas compartidas directamente con amigos). Ambas conviven en
  `supabase/social.sql`: `follows` (instantánea) y `friend_requests`
  (una fila con `status = 'accepted'` ES la amistad, sin tabla
  separada — mismo patrón en `list_invites` para colaboradores).
- **Visibilidad**: diario, favorita y pendientes son legibles por
  quien te sigue (nuevas políticas RLS `*_seguidores_leen` sobre
  `watched`/`favorite`, y una tabla nueva `pending_sync`). Las listas
  siguen siendo privadas por defecto; `lists.is_public` es el toggle
  explícito. Una lista puede además tener colaboradores (edición),
  algo independiente de si es pública.
- **"Pendientes" pasa a tener un espejo en servidor**
  (`pending_sync`), solo para que aparezca en el perfil público de
  quien te sigue — la fuente principal sigue siendo `localStorage`
  (`lib/watchlist.ts`); esta tabla es una copia de solo lectura hacia
  fuera, escrita por la propia cuenta. Es la única pieza de esta fase
  que amplía lo que antes era "solo de este dispositivo".
- **Username público**: no existía ningún perfil hasta ahora (el login
  es solo por email). Tabla `profiles` nueva, con validación de
  formato + lista negra básica en `lib/supabase/profiles.ts`
  (`validateUsername`). El buscador es siempre abierto (decisión
  explícita), así que esta moderación mínima no es opcional para el
  lanzamiento.
- **Feed de actividad** (`lib/supabase/feed.ts`): combina `watched` +
  `lists` (solo las públicas) de la gente que sigues, sin ninguna
  regla de visibilidad propia — hereda tal cual lo que el resto de
  políticas ya deja ver. Tiene estado vacío con llamada a "Buscar
  amigos"/"Compartir mi perfil".
- **Notificaciones**: cuatro tipos en una sola pantalla
  (`NotificacionesDialog.tsx` + `lib/supabase/notifications.ts`) —
  solicitud de amistad e invitación a lista (Aceptar/Rechazar),
  recomendación (informativa + "Añadir a pendientes") y nuevo
  seguidor (solo informativa). Sin email: la bolita del icono cuenta
  solicitudes/invitaciones/recomendaciones pendientes más seguidores
  nuevos desde la última vez que se abrió el panel
  (`lib/notificationsSeen.ts`, marca local por dispositivo).
- **Arranque en frío**: "Compartir mi perfil" genera un código de
  invitación (`invite_codes`) en vez de enlazar directo al perfil.
  `/invitar/[codigo]` lo resuelve: con sesión, al instante; sin
  sesión, el enlace mágico del login vuelve a esa misma URL
  (`emailRedirectTo`) y se resuelve justo después de verificarlo.
  QR real con `qrcode.react` + enlace de WhatsApp, en
  `ShareProfileDialog.tsx`.
- **Listas compartidas**: toggle público + colaboradores, dentro del
  `ListDetailDialog.tsx` que ya existía (no una pantalla nueva).
  Cualquier colaborador puede invitar a más gente; solo el creador
  puede echar a alguien. Duplicados resueltos por una restricción
  `unique` ya existente en `list_items`.
- **Riesgo señalado y no resuelto en esta fase**: el feed y el
  buscador son los puntos de mayor coste si la app crece (consultas
  `in (...)` sobre `watched`/`lists` sin paginación por cursor, solo
  `limit`). Vigilar si hace falta paginar de verdad más adelante.

**Dónde**: `supabase/social.sql` (todo el esquema nuevo + RLS);
`lib/supabase/{profiles,follows,friends,listInvites,recommendations,
reports,pendingSync,inviteCodes,feed,notifications}.ts`;
`lib/notificationsSeen.ts`; `hooks/useProfile.ts`;
`components/account/{UsernameSetup,FriendsTab,BuscarAmigosDialog,
NotificacionesDialog,ShareProfileDialog,RecommendDialog,
ProfilePublicScreen,ListaInvitarDialog}.tsx`;
`components/account/{AccountScreen,ListsTab,ListDetailDialog}.tsx`
(enganchados); `app/u/[username]/`; `app/invitar/[codigo]/`;
`app/entrar/LoginForm.tsx` (acepta `redirectTo`).

**Pendiente, deliberadamente fuera de esta fase**: no hay reportar
listas (solo perfiles) aunque la función ya existe en
`lib/supabase/reports.ts`; no hay tests automáticos para la capa
nueva (se verificó con `npm run typecheck` y `npm test`, que sigue en
verde, pero son los tests existentes, no nuevos para esta feature).
Fusionado a producción y con los ajustes siguientes en la entrada de
abajo.

## 2026-10 · Amigos: ajustes tras el primer uso real

Varios ajustes a la capa social de arriba, pedidos tras probarla con
datos reales:

- **Siguiendo/Seguidores/Amigos** en la pestaña Amigos ahora son tres
  listas de verdad: antes el botón cambiaba de texto pero la lista de
  debajo siempre era "Siguiendo". El feed de Novedades agrupa además
  ráfagas consecutivas de la misma persona ("vio Aida y 4+"), con un
  diálogo nuevo (`FeedGroupDialog.tsx`) para ver el detalle completo
  de lo agrupado en vez de solo el primer elemento.
- **Perfil público compacto**: `ProfilePublicScreen.tsx` añade un
  resumen 2×3 (Totales/Este mes/Racha, Nota media/Pendientes/
  Descartadas) con los mismos colores que "Mi Resumen"
  (`MiResumenScreen.tsx`, que de paso pasa también a 2×3 en vez de
  una fila ancha + una de 2, por consistencia). Totales, Pendientes y
  las listas públicas abren un diálogo de solo lectura con los
  pósters (`TitleGridDialog.tsx`); Descartadas sigue siendo privado
  en el perfil de otra persona (icono de candado, `LockIcon` en
  `components/icons/Icons.tsx`) — decisión explícita: no se crea
  ningún espejo en servidor para "No me apetece".
- **Seguidor "fantasma"**: `follows.follower_id` referencia
  `auth.users`, no `profiles`, así que alguien puede seguir sin haber
  terminado de crear su @usuario. Eso dejaba un seguidor sin perfil
  resoluble: el contador de la pestaña Amigos salía de
  `followerIds.length` (la fila cruda) mientras la lista de debajo
  salía de los perfiles resueltos — contaban cosas distintas. Ahora
  el contador usa el mismo array de perfiles que se muestra, y la
  notificación de nuevo seguidor se omite si no hay perfil que
  resolver (antes decía "Alguien te sigue ahora" sin más).
- **Seguir/pedir amistad exige @usuario**: mismo problema de origen
  que el punto anterior, resuelto en el otro sentido — antes de que
  ocurra. `ProfilePublicScreen.tsx` comprueba el perfil del propio
  visitante (`useProfile`) antes de dejarle seguir o pedir amistad;
  si no tiene @usuario, en vez de crear la fila lo manda a
  `/mi-cuenta?tab=amigos` (nuevo soporte de `?tab=` en
  `AccountScreen.tsx`, leído en un efecto para no desajustar el
  render de servidor/cliente), donde `FriendsTab` ya mostraba
  `UsernameSetup` cuando falta el perfil.
- **Documentación actualizada** a la vez que el código: `/privacidad`
  gana una sección "Si usas la función de «Amigos»" (qué se vuelve
  público, qué guarda cada acción); `/aviso-legal` menciona que el
  @usuario es público; `docs/DATABASE.md` documenta por fin las
  tablas de `supabase/social.sql` (antes solo estaban en este
  archivo) y corrige la afirmación de que "nadie puede leer filas de
  otra cuenta" (ya no es cierto desde que existen las políticas de
  seguidores/público); `docs/ARCHITECTURE.md` añade las rutas
  `/u/[username]` e `/invitar/[codigo]` y la pestaña Amigos a la
  tabla de rutas y a "dónde vive cada dato".

**Dónde**: `components/account/{FriendsTab,ProfilePublicScreen,
AccountScreen,FeedGroupDialog,TitleGridDialog}.tsx`;
`components/summary/MiResumenScreen.tsx`; `components/icons/
Icons.tsx` (`LockIcon`); `lib/supabase/{feed,notifications}.ts`;
`app/privacidad/page.tsx`; `app/aviso-legal/page.tsx`;
`docs/{DATABASE,ARCHITECTURE}.md`.
