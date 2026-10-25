# Marca (identidad visual)

Esto es sobre lo visual: color, tipografía, logo, iconografía. Para
la voz y el tono, ver `PERSONALITY.md`; para la visión de producto,
`PRODUCT_BIBLE.md` y `PHILOSOPHY.md`.

## Nombre y logo

**La Butaca Secreta**. Logo en `public/Logo.png`, visible en la
cabecera de la pestaña Recomendador (oculto en móvil, solo desde
`md:`). El nombre completo del sitio y su descripción corta viven en
`lib/site.ts` (`SITE_NAME`, `SITE_TAGLINE`, `SITE_DESCRIPTION`): es la
fuente única para metadata, Open Graph, etc. — no se repite el nombre
a mano en otros sitios.

## Color

Tema oscuro siempre (no hay modo claro). Tokens en
`app/globals.css`:

| Token             | Valor                     | Uso                                  |
| ------------------ | --------------------------- | --------------------------------------- |
| `--background`     | `#09090b`                   | Fondo base                            |
| `--background-secondary` | `#18181b`              | Fondos secundarios                    |
| `--foreground`     | `#fafafa`                   | Texto principal                       |
| `--foreground-muted` | `#a1a1aa` (≈ `text-zinc-400`) | Texto secundario / metadatos       |
| `--border`          | `rgba(255,255,255,0.08)`    | Bordes sutiles                        |
| `--card`            | `rgba(24,24,27,0.65)`       | Fondo de tarjeta sobre el póster de fondo |
| `--accent`          | `#ef4444` (≈ `red-500`)     | Color de marca: acentos, estado activo, acciones principales |

En la práctica, el rojo de marca se usa con las utilidades de
Tailwind `red-500`/`red-600` (p. ej. `bg-red-600` para botones
primarios, `border-red-500` para la pestaña activa) — no hace falta
mirar el token CSS para saber qué clase usar en un componente nuevo,
basta con seguir lo que ya hace el resto de la UI.

El fondo general es un degradado radial oscuro con un toque de rojo
(`rgba(220, 38, 38, 0.18)`) en la esquina superior izquierda, no un
color plano — ver `body` en `app/globals.css`.

## Tipografía

Dos familias, vía `next/font/google`:

- **Geist** (`--font-geist-sans`) — tipografía por defecto de todo
  el texto del cuerpo.
- **Manrope** (`.title-font`, `--font-manrope`) — para títulos
  destacados donde se quiere más peso visual (p. ej. el nombre de la
  web, titulares de "Mi Resumen").

No se usa una tercera familia ni fuentes de sistema sueltas: si un
componente nuevo necesita una tipografía con más carácter, es
`.title-font`, no una fuente nueva.

## Iconografía

Mezcla deliberada de dos estilos, cada uno con su sitio:

- **Emoji** para las pestañas y elementos de navegación/listado
  (👤 Perfil, 📖 Diario, 📝 Listas, ⏳ Pendientes, 🎬 Recomendador,
  📅 Calendario, 🔎 Buscar…): rápidos de reconocer, sin pedir un set
  de iconos propio, y coherentes con el tono cercano de
  `PERSONALITY.md`.
- **SVG inline a medida** para marcas de terceros e iconos que
  necesitan verse "serios" u oficiales (el icono de Instagram, el
  icono de cuenta/login junto a él): `stroke="currentColor"`,
  `strokeWidth={2}`, trazo redondeado (`strokeLinecap`/
  `strokeLinejoin="round"`), sin relleno — nunca una librería de
  iconos externa.

## Logos de terceros

El logo de TMDb (`public/tmdb-logo.svg`) se usa siempre entero, sin
recortar ni recolorear, con el aviso de atribución oficial en inglés
tal cual lo pide TMDb (ver `/aviso-legal` y `next.config.ts`'s CSP
para `image.tmdb.org`). Los logos de plataformas (Netflix, Prime
Video, Disney+, Max, Filmin) son propiedad de sus titulares; la web
no se presenta como afiliada a ninguna (ver `/aviso-legal`).

## Tono visual

Oscuro, con pósters de película de fondo (`PosterWall`) y tarjetas
semitransparentes con `backdrop-blur` encima — nunca fondo blanco ni
tarjetas opacas planas. El objetivo es que se sienta como una sala de
cine, no como un panel de administración.
