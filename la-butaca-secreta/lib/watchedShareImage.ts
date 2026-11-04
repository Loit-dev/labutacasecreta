/**
 * Dibuja la imagen de "Ya la he visto" (póster + título + estrellas) en
 * un canvas. Mismo formato 9:16 (1080×1920) y mismo fondo cinematográfico
 * que el resto de imágenes para compartir (lib/shareImage.ts, de donde
 * se reutiliza el fondo/viñeteado y la carga de imágenes), para que se
 * reconozca de un vistazo que es de la web.
 */

import type { Rating } from "./rating";
import {
  BACKDROP_FILES,
  SHARE_HEIGHT,
  SHARE_WIDTH,
  drawBackdrop,
  loadImage,
  wrapLines,
  type DrawableImage,
} from "./shareImage";

export type WatchedShareOptions = {
  siteName: string;
  siteUrl: string;
  title: string;
  kind: "movie" | "tv";
  rating?: Rating;
  // Sin la "@": se añade al dibujar.
  username?: string;
  // Ya formateada para enseñar ("4 de noviembre de 2026")
  seenAtLabel?: string;
  // Frase antes de la fecha (p.ej. "le encantó el", "no le gustó el");
  // se obtiene con pickSeenVerb(rating) para que varíe según la nota
  // y no salga siempre igual al compartir.
  seenVerb?: string;
  posterUrl?: string;
  fontFamily?: string;
  logo?: DrawableImage | null;
  backdrops?: (DrawableImage | null)[];
  poster?: DrawableImage | null;
};

// Variantes de la frase que acompaña a la fecha (junto al "@usuario"),
// agrupadas por lo que puntuó, para que la frase cuente algo sobre si
// le gustó o no (no solo que la vio) y además varíe cada vez que se
// comparte. Sin nota, se usa un grupo neutro.
const SEEN_PHRASES_NEUTRAL = ["ha visto", "la vio", "la terminó"];

const SEEN_PHRASES_BY_RATING: { min: number; phrases: string[] }[] = [
  { min: 4.5, phrases: ["le encantó", "le ha encantado", "le pareció genial"] },
  { min: 3.5, phrases: ["le gustó mucho", "la disfrutó mucho"] },
  { min: 2.5, phrases: ["le gustó", "le pareció bien"] },
  { min: 1.5, phrases: ["no le convenció mucho", "le dejó frío"] },
  { min: 0, phrases: ["no le gustó", "no le gustó nada"] },
];

/**
 * Elige al azar una frase para acompañar la fecha ("<frase> el
 * <fecha>"), del grupo que corresponda a la nota (o neutra si no hay
 * valoración), para que cambie cada vez que se comparte.
 */
export function pickSeenVerb(rating?: Rating): string {
  const phrases = rating
    ? SEEN_PHRASES_BY_RATING.find((group) => rating >= group.min)!.phrases
    : SEEN_PHRASES_NEUTRAL;

  return `${phrases[Math.floor(Math.random() * phrases.length)]} el`;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Mismo icono de estrella (Material Symbols) que el selector de
// valoración (components/recommendations/RatingPrompt.tsx), para que
// la imagen compartida se parezca a lo que se vio al puntuar.
const STAR_PATH =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

function drawStars(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  rating: number,
  size: number
) {
  const count = 5;
  const gap = 16;
  const totalW = count * size + (count - 1) * gap;
  const path = new Path2D(STAR_PATH);

  let x = centerX - totalW / 2;

  for (let i = 0; i < count; i++) {
    const fill = Math.max(0, Math.min(1, rating - i));

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    ctx.fillStyle = "#3f3f46";
    ctx.fill(path);

    if (fill > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, fill * 24, 24);
      ctx.clip();
      ctx.fillStyle = "#facc15";
      ctx.fill(path);
      ctx.restore();
    }

    ctx.restore();

    x += size + gap;
  }
}

export function drawWatchedShareImage(
  ctx: CanvasRenderingContext2D,
  options: WatchedShareOptions
) {
  const font =
    options.fontFamily ||
    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  const W = SHARE_WIDTH;

  drawBackdrop(ctx, options);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  // ---------- Logo ----------
  const logo = options.logo;

  if (logo && logo.width > 0 && logo.height > 0) {
    const logoH = 170;
    const logoW = (logo.width / logo.height) * logoH;

    ctx.drawImage(logo, W / 2 - logoW / 2, 225, logoW, logoH);
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.font = `800 32px ${font}`;
    ctx.fillText(options.siteName.toUpperCase(), W / 2, 330);
  }

  // ---------- Titular ----------
  const headline = "¡Ya la he visto!";
  let headlineSize = 72;

  ctx.font = `800 ${headlineSize}px ${font}`;

  while (
    headlineSize > 40 &&
    ctx.measureText(headline).width > W - 120
  ) {
    headlineSize -= 4;
    ctx.font = `800 ${headlineSize}px ${font}`;
  }

  const headlineW = ctx.measureText(headline).width;

  const headlineGradient = ctx.createLinearGradient(
    W / 2 - headlineW / 2,
    0,
    W / 2 + headlineW / 2,
    0
  );

  headlineGradient.addColorStop(0, "#ffffff");
  headlineGradient.addColorStop(0.55, "#ffffff");
  headlineGradient.addColorStop(1, "#fb923c");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = headlineGradient;
  ctx.fillText(headline, W / 2, 468);
  ctx.restore();

  // Hueco uniforme entre bloques (póster, estrellas, fecha, chip de la
  // web), para que no se vean pegados unos a otros.
  const GAP = 90;

  // ---------- Título de la película/serie (hasta 2 líneas) ----------
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 54px ${font}`;

  const titleLines = wrapLines(
    (text) => ctx.measureText(text).width,
    options.title,
    W - 160,
    2
  );

  const titleTop = 566;
  const titleLineH = 64;

  titleLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, titleTop + i * titleLineH);
  });

  const titleBottom = titleTop + (titleLines.length - 1) * titleLineH;

  // ---------- Póster grande ----------
  const posterTop = titleBottom + GAP;
  const posterH = 650;
  const posterW = posterH * (2 / 3);
  const posterX = W / 2 - posterW / 2;

  ctx.save();
  ctx.shadowColor = "rgba(251,146,60,0.4)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 14;
  roundedRect(ctx, posterX, posterTop, posterW, posterH, 28);
  ctx.fillStyle = "#18181b";
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, posterX, posterTop, posterW, posterH, 28);
  ctx.clip();

  const poster = options.poster;

  if (poster && poster.width > 0 && poster.height > 0) {
    const scale = Math.max(
      posterW / poster.width,
      posterH / poster.height
    );

    ctx.drawImage(
      poster,
      posterX + posterW / 2 - (poster.width * scale) / 2,
      posterTop + posterH / 2 - (poster.height * scale) / 2,
      poster.width * scale,
      poster.height * scale
    );
  } else {
    const fallback = ctx.createLinearGradient(
      0,
      posterTop,
      0,
      posterTop + posterH
    );

    fallback.addColorStop(0, "#27272a");
    fallback.addColorStop(1, "#18181b");

    ctx.fillStyle = fallback;
    ctx.fillRect(posterX, posterTop, posterW, posterH);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = `600 30px ${font}`;
    ctx.fillText("Sin póster", W / 2, posterTop + posterH / 2);
  }

  ctx.restore();

  roundedRect(
    ctx,
    posterX + 2,
    posterTop + 2,
    posterW - 4,
    posterH - 4,
    28
  );
  ctx.strokeStyle = "rgba(251,146,60,0.75)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // ---------- Estrellas (si hay valoración) y fecha de visionado ----------
  // El margen de abajo (desde la frase final hasta el borde del lienzo)
  // se fija igual que el de arriba (antes del logo), y el hueco entre
  // el póster y el chip se reparte a partes iguales entre los bloques
  // que haya en medio (estrellas, fecha), para que no quede nada
  // pegado. La frase de abajo se deja pegada al chip, como ya estaba.
  const topMargin = 225;
  const taglineBottomOffset = 118; // footY + 112 (línea base) + ~6 de descendente
  const footY = SHARE_HEIGHT - topMargin - taglineBottomOffset;

  const posterBottom = posterTop + posterH;
  const starsSize = 58;
  // Bloque de la fecha: si hay usuario, "@usuario" + "ha visto <fecha>"
  // en dos líneas; si no, el "Vista el <fecha>" de una sola línea.
  const dateBlockH = options.username ? 78 : 36;

  const blockCount = (options.rating ? 1 : 0) + (options.seenAtLabel ? 1 : 0);
  const gapCount = blockCount + 1;
  const blocksH =
    (options.rating ? starsSize : 0) + (options.seenAtLabel ? dateBlockH : 0);
  const evenGap = (footY - posterBottom - blocksH) / gapCount;

  let contentBottom = posterBottom;

  if (options.rating) {
    const starsTop = contentBottom + evenGap;
    drawStars(ctx, W / 2, starsTop, options.rating, starsSize);
    contentBottom = starsTop + starsSize;
  }

  if (options.seenAtLabel) {
    const blockTop = contentBottom + evenGap;

    if (options.username) {
      const name = options.username.replace(/^@/, "");
      const handle = `@${name.charAt(0).toUpperCase()}${name.slice(1)}`;

      ctx.font = `800 40px ${font}`;

      const handleW = ctx.measureText(handle).width;

      // Mismo degradado (blanco → naranja) que el titular de arriba,
      // para darle más presencia que un texto plano.
      const handleGradient = ctx.createLinearGradient(
        W / 2 - handleW / 2,
        0,
        W / 2 + handleW / 2,
        0
      );

      handleGradient.addColorStop(0, "#ffffff");
      handleGradient.addColorStop(0.55, "#ffffff");
      handleGradient.addColorStop(1, "#fb923c");

      const usernameBaseline = blockTop + 30;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = handleGradient;
      ctx.fillText(handle, W / 2, usernameBaseline);
      ctx.restore();

      ctx.fillStyle = "#d4d4d8";
      ctx.font = `600 30px ${font}`;
      const dateBaseline = usernameBaseline + 38;
      const verb = options.seenVerb ?? "ha visto el";
      ctx.fillText(`${verb} ${options.seenAtLabel}`, W / 2, dateBaseline);

      contentBottom = dateBaseline + 10;
    } else {
      ctx.fillStyle = "#e4e4e7";
      ctx.font = `600 34px ${font}`;
      const dateBaseline = blockTop + 26;
      ctx.fillText(`Vista el ${options.seenAtLabel}`, W / 2, dateBaseline);

      contentBottom = dateBaseline + 10;
    }
  }

  // ---------- Pie ----------
  const url = options.siteUrl.replace(/^https?:\/\//, "");

  ctx.font = `800 40px ${font}`;

  const pillW = ctx.measureText(url).width + 90;
  const pillX = W / 2 - pillW / 2;

  const pillGradient = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0);

  pillGradient.addColorStop(0, "#b91c1c");
  pillGradient.addColorStop(1, "#ea580c");

  ctx.save();
  ctx.shadowColor = "rgba(239,68,68,0.5)";
  ctx.shadowBlur = 30;
  roundedRect(ctx, pillX, footY, pillW, 74, 37);
  ctx.fillStyle = pillGradient;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(url, W / 2, footY + 51);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = `500 26px ${font}`;
  ctx.fillText(
    options.kind === "tv"
      ? "¿Y tú? Descubre qué serie ver aquí."
      : "¿Y tú? Descubre qué película ver aquí.",
    W / 2,
    footY + 112
  );
}

/** Crea la imagen de "Ya la he visto" y la devuelve lista para compartir o descargar. */
export async function createWatchedShareImage(
  options: WatchedShareOptions
): Promise<Blob> {
  const [logo, backdrops, poster] = await Promise.all([
    loadImage("/Logo.png"),
    Promise.all(BACKDROP_FILES.map((file) => loadImage(file))),
    loadImage(options.posterUrl),
  ]);

  try {
    if (options.fontFamily) {
      await document.fonts.load(`800 40px ${options.fontFamily}`);
    }

    await document.fonts.ready;
  } catch {
    // Sin la tipografía de la web se usa una del sistema
  }

  const canvas = document.createElement("canvas");

  canvas.width = SHARE_WIDTH;
  canvas.height = SHARE_HEIGHT;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Tu navegador no puede crear la imagen.");
  }

  drawWatchedShareImage(ctx, { ...options, logo, backdrops, poster });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}
