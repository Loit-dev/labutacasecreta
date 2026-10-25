# Roadmap

No es una lista de promesas con fecha, es una foto de qué está hecho
y qué queda abierto, para no perder el hilo entre sesiones. Se
actualiza según avanza el proyecto.

## Hecho (en producción)

- Conversación adaptativa (solo / acompañado-grupo / Butaca Exprés)
- Calendario de estrenos (TMDb + TVmaze)
- Buscador de títulos
- "Mi lista" (pendientes, por dispositivo)
- Compartir resultado (imagen y enlace, incluido modo acompañado)
- Instalación como app (PWA, botón "Instalar app")
- Cuenta de usuario opcional (login por enlace mágico, Supabase)
- "Mi cuenta": Perfil (resumen personal + toque competitivo del
  mes), Diario (vistas con fecha y nota, editable/borrable), Listas
  (crear varias, añadir/quitar títulos), Pendientes
- Páginas SEO por género/plataforma, ficha de título y de persona
  (reparto)
- Accesibilidad: navegación por teclado, lectores de pantalla,
  pensado mobile-first (sin interacciones que dependan solo de hover)
- Avisos legales y de privacidad en español, al día con lo anterior

## Abierto / mejoras continuas

No es el MVP lo que falta, son mejoras sobre lo que ya funciona:

- **SEO**: seguir ampliando cobertura de páginas por género/plataforma
  y de ficha de título.
- **Rendimiento**: seguir bajando tiempos de carga en móvil
  (Vercel Speed Insights ya lo mide).
- **Calendario**: ampliar cobertura de estrenos (más plataformas,
  más fuentes).
- **Borrado de cuenta con un botón propio**: hoy se pide por correo
  (`/privacidad`); un flujo de autoservicio sería más cómodo.
- **Diario ↔ resto de la web**: editar o borrar una entrada del
  diario en Mi cuenta actualiza Supabase pero no el espejo local
  (`lib/rating.ts` / `lib/viewed.ts`) que usa el resto de la app
  (p. ej. la insignia "Vista · ⭐ nota" en la ficha de un título).
  Es una inconsistencia menor y consciente, no un error.
- **`e2e` en CI**: el job falla de forma conocida en el paso
  "Instalar el navegador" (entorno, no la app) desde antes de esta
  documentación; sería bueno arreglarlo para que vuelva a ser una
  señal útil en vez de algo que se ignora siempre.

## Notas para quien retome esto

- La fuente de verdad del estado real es siempre la propia web en
  producción y los commits recientes, no esta lista: si algo de aquí
  ya no es cierto, el roadmap es lo que hay que corregir, no el
  código.
- Antes de proponer una función nueva, revisa `PRODUCT_BIBLE.md` y
  `PHILOSOPHY.md`: la regla de oro del proyecto es que una función
  que mejora la "conversación" (la experiencia) vale la pena aunque
  sea más difícil técnicamente, y al revés.
