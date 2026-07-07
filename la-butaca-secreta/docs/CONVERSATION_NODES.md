# CONVERSATION_NODES.md

# Motor de Conversación

La Butaca Secreta no utiliza un flujo fijo de preguntas.

Cada conversación se construye dinámicamente en función de las respuestas del usuario.

El objetivo no es completar un formulario.

El objetivo es obtener la información suficiente para recomendar tres títulos con la mayor confianza posible.

---

# Filosofía

El motor no piensa en preguntas.

Piensa en información.

Cada nodo representa una pieza de información que todavía no conocemos.

Las preguntas son únicamente una forma de obtener esa información.

---

# Funcionamiento

Cada nodo tiene:

- un objetivo
- una prioridad
- un valor informativo
- condiciones de aparición
- condiciones para omitirse
- posibles siguientes nodos

El motor siempre elegirá el nodo que más aumente la confianza de la recomendación.

Nunca existe un orden obligatorio.

---

# Estados del motor

Explorando

Sabemos muy poco sobre el usuario.

Objetivo:

Obtener la información más importante.

---

Afinando

Ya conocemos el perfil general.

Objetivo:

Resolver dudas concretas.

---

Listo

El motor considera que ya puede recomendar tres títulos de alta calidad.

La conversación termina.

---

# Nodos

---

## content_type

Objetivo

Saber si el usuario busca una película o una serie.

Obligatorio

Sí

Valor informativo

Muy alto

Pregunta

¿Qué te apetece hoy?

Opciones

🎬 Película

📺 Serie

Siguientes posibles

company

mood

---

## company

Objetivo

Saber con quién va a ver el contenido.

Obligatorio

Sí

Valor informativo

Alto

Pregunta

¿Con quién vas a verla?

Opciones

🙋 Solo

❤️ En pareja

👨‍👩‍👧 En familia

🍻 Con amigos

Siguientes posibles

mood

duration

---

## mood

Objetivo

Descubrir la experiencia que busca.

Nunca preguntamos por géneros.

Obligatorio

Sí

Valor informativo

Muy alto

Pregunta

¿Qué te apetece sentir hoy?

Opciones

😂 Reírme

😰 Estar en tensión

🤯 Que me haga pensar

❤️ Emocionarme

🚀 Vivir una aventura

😲 Sorprenderme

🎲 Me da igual, sorpréndeme tú

Siguientes posibles

restrictions

pace

duration

freshness

---

## restrictions

Objetivo

Descubrir qué quiere evitar.

Obligatorio

Sí

Valor informativo

Muy alto

Pregunta

¿Hay algo que hoy no te apetezca ver?

IMPORTANTE

Las opciones cambian según las respuestas anteriores.

Nunca existe una lista fija.

Ejemplos

Si busca tensión

• Sobrenatural

• Gore

• Terror psicológico

• Finales abiertos

• Ninguna

Si busca reírse

• Humor negro

• Humor absurdo

• Comedia romántica

• Humor incómodo

• Ninguna

Si busca emocionarse

• Historias muy tristes

• Basadas en hechos reales

• Mucha violencia

• Ritmo lento

• Ninguna

---

## duration

Objetivo

Conocer el tiempo disponible.

Obligatorio

No

Valor informativo

Medio

Pregunta

¿Cuánto tiempo quieres dedicarle?

Opciones

⏱️ Menos de 90 minutos

🍿 Una duración normal

🎬 Hoy tengo toda la tarde

🤷 Me da igual

---

## pace

Objetivo

Conocer el ritmo narrativo deseado.

Obligatorio

No

Valor informativo

Medio

Pregunta

¿Qué ritmo te apetece?

Opciones

🔥 Que pasen cosas desde el principio

⚖️ Un equilibrio

🐢 Algo tranquilo

🤷 Me da igual

---

## freshness

Objetivo

Saber si busca novedades o clásicos.

Obligatorio

No

Valor informativo

Medio

Pregunta

¿Qué te apetece más?

Opciones

🆕 Algo nuevo

⭐ Un clásico

🎲 Me da igual

---

## language

Objetivo

Idioma preferido.

Solo aparece cuando aporta valor.

Obligatorio

No

Valor informativo

Bajo

Pregunta

¿Tienes alguna preferencia de idioma?

Opciones

🇪🇸 Español

🎞️ Versión original

🤷 Me da igual

---

## animation

Objetivo

Distinguir entre animación e imagen real cuando sea relevante.

Obligatorio

No

Valor informativo

Bajo

Pregunta

¿Te apetece animación o imagen real?

Opciones

🎨 Animación

🎥 Imagen real

🤷 Me da igual

---

# Nodo interno

## confidence

Este nodo nunca se muestra al usuario.

Su función es decidir cuándo finalizar la conversación.

El motor evaluará continuamente si dispone de información suficiente para recomendar tres títulos con confianza.

Si la respuesta es sí, finalizará la conversación.

Si la respuesta es no, seleccionará el siguiente nodo con mayor valor informativo.

Nunca existe un número fijo de preguntas.

---

# Reglas del motor

## Nunca asumir

El motor nunca inventa preferencias.

Solo interpreta respuestas.

---

## Nunca repetir

Nunca hará una pregunta cuya respuesta ya pueda deducirse.

---

## Nunca preguntar por preguntar

Cada pregunta debe aumentar la confianza de la recomendación.

Si no aporta valor, se elimina.

---

## Restricciones adaptativas

La pregunta sobre restricciones siempre es obligatoria.

Las opciones nunca son fijas.

Siempre dependen del contexto de la conversación.

---

## Conversaciones diferentes

Dos usuarios nunca deberían recorrer exactamente el mismo camino.

El motor seleccionará dinámicamente el siguiente nodo.

---

## Menos preguntas, mejores recomendaciones

El objetivo no es llegar a diez preguntas.

El objetivo es llegar a suficiente confianza.

Una conversación puede terminar en cinco preguntas.

Otra puede necesitar nueve.

Ambas serán correctas.

---

# Regla de Oro

La Butaca Secreta no intenta averiguar qué género quiere ver el usuario.

Intenta entender cómo quiere sentirse.

Ese es el principio que guía todo el motor conversacional.