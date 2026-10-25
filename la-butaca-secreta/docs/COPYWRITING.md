# Copywriting (microcopy de la interfaz)

La voz y el tono de **la conversación** (cómo pregunta, cómo
recomienda, cómo se equivoca) están definidos a fondo en
`PERSONALITY.md` — léelo primero, esto no lo repite. Este documento
es más pequeño y más práctico: cómo se escriben los textos de
interfaz (botones, mensajes vacíos, errores técnicos) que no son
parte de la conversación en sí, con ejemplos reales ya en el código.

## Botones y acciones

- Verbo en infinitivo o imperativo corto, sin "Enviar"/"Aceptar"
  genéricos: **"Guardar valoración"**, **"Marcar como vista"**,
  **"Crear"**, **"Añadir título"**, **"Quitar"**, **"Borrar esta
  lista"**.
- La acción dice qué va a pasar, no cómo se llama el control:
  "Olvidar mis títulos vistos", no "Borrar localStorage".
- Confirmar una acción reversible no necesita texto de más: un "✕"
  con `aria-label` descriptivo basta (el texto largo va en el
  `aria-label`, no visible, para quien use lector de pantalla).

## Estados vacíos

Nunca "No hay datos" ni "Vacío". Siempre explican qué hacer para que
deje de estarlo, en el mismo tono cercano de la conversación:

> "Todavía no tienes listas. Crea una con el botón «+» para empezar a
> agrupar títulos (por ejemplo, «Terror» o «Pelis de Navidad»)."

> "Todavía no hay nada en tu diario. Marca alguna película o serie
> como «Ya la vi» y aparecerá aquí."

## Errores

Dos públicos distintos, dos registros distintos:

- **De cara al usuario** (lo que ve en pantalla): nunca un mensaje
  técnico, nunca "Error 500" ni un stack trace. Corto, sin culpar a
  nadie: *"No he podido buscar ahora mismo. Prueba otra vez en un
  rato."*, *"Demasiadas búsquedas, prueba en un minuto."* Si hace
  falta más carácter (ver `PERSONALITY.md` → "Cómo se equivoca"),
  mejor aún: *"Uy... hoy las plataformas no me lo están poniendo
  fácil."*
- **De cara a quien desarrolla** (`console.error`): sí puede ser
  técnico y en infinitivo pasivo, siempre con el patrón **"No se
  pudo \<verbo\> \<qué\>:"** seguido del error real — así se filtra
  fácil en la consola. Ejemplos ya en el código: *"No se pudo crear
  la lista:"*, *"No se pudo añadir el título a la lista:"*, *"No se
  pudo guardar en Supabase (watched):"*. No se mezclan los dos
  registros: lo que ve el usuario nunca es lo mismo que lo que entra
  en `console.error`.

## Confirmaciones destructivas

`window.confirm` siempre con el nombre de lo que se va a borrar entre
comillas, para que quede claro qué se pierde:

> `¿Borrar la lista "${list.name}"?`

> `¿Borrar "${row.title}" de tu diario?`

## Capitalización y puntuación

- Frases cortas, sin punto final en etiquetas de botón o de pestaña
  ("Guardar valoración", no "Guardar valoración.").
- Mayúscula solo al principio de la frase (sin Title Case): "Marcar
  como vista", no "Marcar Como Vista".
- Comillas angulares («así») para resaltar una palabra o frase exacta
  de la interfaz dentro de un texto explicativo, como en los avisos
  legales y de privacidad.
- Tú, nunca usted — coherente con `PERSONALITY.md`.

## Antes de escribir un texto nuevo

1. ¿Es parte de la conversación (preguntas, recomendaciones,
   celebraciones, errores de la propia conversación)? → sigue
   `PERSONALITY.md` al pie de la letra, incluida la lista de
   "palabras que evitaremos" (algoritmo, IA, procesando…).
2. ¿Es un texto de interfaz (botón, estado vacío, confirmación)? →
   sigue este documento y busca un ejemplo parecido ya existente en
   el código antes de inventar un patrón nuevo.
3. ¿Es legal (privacidad, aviso legal)? → registro más formal y
   preciso, pero igual de claro; evita la jerga legal innecesaria.
