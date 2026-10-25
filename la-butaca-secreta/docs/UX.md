# UX

Patrones de interacción reales del proyecto, no un manual de estilo
teórico. La voz y el tono están en `PERSONALITY.md`; esto es sobre
cómo se comportan los componentes.

## Mobile-first, en serio

El tráfico es sobre todo móvil, así que estas reglas no son
opcionales:

- **Nunca un control que solo funcione con `hover`.** En
  pantalla táctil no hay hover: un botón con `opacity-0
  group-hover:opacity-100` es invisible e inalcanzable en móvil. Si
  una acción importa (quitar algo, editar algo), se ve siempre.
  (Aprendido de un bug real: el botón "✕" para quitar un título de
  una lista en Mi cuenta solo aparecía con hover y nadie podía
  usarlo desde el móvil.)
- **`flex-1` necesita `min-w-0` para repartir espacio de verdad.**
  Un botón de texto dentro de un contenedor `flex` con `flex-1` no
  se encoge por debajo del ancho de su propio contenido salvo que
  lleve `min-w-0`. Sin eso, en pantallas estrechas los elementos más
  largos (p. ej. "Pendientes" en una barra de 4 pestañas) no reparten
  el espacio por igual y desbordan o descuadran la fila. Si el texto
  puede ser largo, además de `min-w-0` conviene dejarlo bajar a una
  segunda línea en vez de cortarlo con `text-ellipsis`: perder una
  palabra a la mitad es peor que ocupar una línea más.
- Antes de dar por buena una pantalla nueva, pensar explícitamente en
  el ancho real de un móvil (~360-412px), no solo en el ancho del
  escritorio donde se suele probar.

## Pestañas (tablist)

El patrón de pestañas (inicio: Recomendador/Calendario/Buscar; Mi
cuenta: Perfil/Diario/Listas/Pendientes) es siempre el mismo:

- Fila `flex items-stretch`, a ras de los bordes de la tarjeta
  (arriba y a los lados) — la tarjeta no lleva padding propio, cada
  pestaña lo lleva por dentro; el contenido de abajo sí lo lleva
  (ver `AccountScreen.tsx` / `Conversation.tsx` para el patrón
  exacto).
- Cada botón `flex-1 min-w-0`, con icono + etiqueta, borde inferior
  de 3px: rojo en la pestaña activa, transparente en las demás.
  `role="tablist"` / `role="tab"` / `aria-selected`, navegación con
  flechas donde aplica (ver `Conversation.tsx`).
- Un hueco fijo (no `flex-1`) puede añadirse al final para una acción
  que no es una pestaña más (hoy: el acceso a la cuenta en inicio).

## Diálogos (modal)

Patrón compartido por `TitlePickerDialog`, `ListDetailDialog`,
`DetailsModal`, etc.:

- `createPortal` a `document.body`, overlay `fixed inset-0 bg-black/80
  backdrop-blur-sm`, cierre al pulsar fuera (`onClick` en el overlay
  + `stopPropagation` en el contenido).
- `role="dialog"` `aria-modal="true"`, foco inicial dentro del
  diálogo, cierre con Escape — centralizado en el hook `useDialog`.
- Un diálogo puede abrir otro por encima (p. ej. "Añadir título"
  dentro de "Mi lista") subiendo el `z-index` (`z-[60]` sobre el
  `z-50` del primero) en vez de cerrar el de abajo.

## Estados de carga / vacío / guarda necesaria

Todas las pantallas que dependen de datos (de Supabase o de TMDb)
distinguen explícitamente:

1. **Cargando** — "Cargando…", nunca una pantalla en blanco.
2. **Vacío** — mensaje concreto explicando qué hacer para que deje de
   estarlo (nunca un genérico "no hay datos"), p. ej. "Todavía no
   tienes listas. Crea una con el botón «+»…".
3. **Necesita cuenta** — mensaje explicando por qué, con un botón a
   "Entrar" (`RequireAccount` lo centraliza para las pestañas de Mi
   cuenta que lo necesitan, en vez de repetir la lógica en cada una).
4. **Error** — mensaje que no culpa al usuario ni muestra detalles
   técnicos (ver "Cómo se equivoca" en `PERSONALITY.md`).

## Acciones destructivas

Borrar una lista o una entrada del diario pide confirmación con
`window.confirm` antes de llamar a Supabase; no hay deshacer. Quitar
un título de una lista o de "Mi lista"/pendientes, en cambio, no pide
confirmación: es una acción de un paso, fácil de repetir si te
equivocas (puedes volver a añadir el título).

## Formularios ligeros

Crear/renombrar una lista no usa un formulario con botón "Guardar":
es un `<input>` que confirma con Enter o al perder el foco (`onBlur`)
y cancela con Escape — menos fricción que abrir un diálogo aparte
para un solo campo de texto.
