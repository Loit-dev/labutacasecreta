# Conversation Engine

## Filosofía

La Butaca Secreta no hace preguntas.

Mantiene una conversación.

Cada respuesta modifica el estado de la conversación y determina cuál es la siguiente mejor pregunta.

Nunca existe un flujo fijo.

---

# Principios

## 1. No existen formularios

Cada conversación debe sentirse diferente.

Dos usuarios con respuestas distintas no deberían recibir la misma secuencia de preguntas.

---

## 2. Las preguntas son adaptativas

Cada pregunta puede cambiar:

- su texto;
- sus opciones;
- su orden;
- el momento en que aparece;
- o incluso desaparecer.

Todo depende de las respuestas anteriores.

---

## 3. Nunca preguntar lo que ya sabemos (dentro de esta conversación)

Si una respuesta de **esta misma conversación** permite deducir otra
(p. ej. quien elige "Solo" no necesita que le preguntemos con quién
va), no se formulan preguntas redundantes.

Esto **no** incluye recordar entre visitas qué género o ánimo se pidió
otras veces para saltarse la pregunta la próxima vez: se probó y se
descartó (ver `docs/DECISIONS.md`, 26 oct 2026) porque lo que apetece
ver cambia de un día para otro, y saltarla sin avisar generaba una
barra de progreso que arrancaba ya adelantada sin explicación. El
cuestionario normal (modo "Solo"/"Acompañado") siempre pregunta todo.
La única excepción intencional es **Butaca Exprés**, que por diseño no
pregunta nada y usa ese historial para adivinar lo mejor posible.

---

## 4. Restricciones contextuales (idea, no implementada aún)

La pregunta "¿Hay algo que hoy no te apetezca ver?" es obligatoria y
sus opciones son siempre las mismas (ver `data/conversation/nodes.ts`,
nodo `restrictions`): terror, violento, romántico, musical,
documental, ninguna.

La idea original era que esas opciones cambiaran según el ánimo
elegido (ejemplos más abajo), pero nunca se implementó así en código.
Se deja aquí como idea para retomar si interesa, no como descripción
de lo que hace hoy la web.

Ejemplos de la idea original:

Si el usuario busca tensión:

- Sobrenatural
- Gore
- Terror psicológico
- Finales abiertos
- Ninguna

Si busca reírse:

- Humor negro
- Humor absurdo
- Comedia romántica
- Humor incómodo
- Ninguna

Si busca emocionarse:

- Historias muy tristes
- Mucha violencia
- Basadas en hechos reales
- Ritmo lento
- Ninguna

---

## 5. Principio de Neutralidad

La Butaca Secreta nunca descartará un género, una categoría o un tipo de contenido salvo que el usuario lo indique explícitamente.

Las respuestas únicamente modifican prioridades.

Nunca generan prejuicios.

---

## 6. Información antes que preguntas

El motor no piensa en preguntas.

Piensa en información pendiente.

Las preguntas son únicamente el mejor método para obtener esa información.

---

## 7. Conversación natural

Las preguntas nunca utilizarán lenguaje técnico.

Nunca aparecerán frases como:

- Selecciona un género.
- Elige una categoría.

Siempre se utilizará lenguaje cercano.

Ejemplo:

¿Qué te apetece sentir esta noche?

¿Hay algo que hoy no te apetezca ver?

¿Cuánto tiempo quieres dedicarle?

---

## 8. Finalización inteligente

La conversación termina cuando el motor considera que tiene suficiente información para generar tres recomendaciones de alta calidad.

Nunca por haber llegado a un número fijo de preguntas.