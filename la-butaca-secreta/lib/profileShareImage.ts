/**
 * Dibuja la imagen de "Compartir mi perfil" (QR con contexto) en un
 * canvas. Mismo formato 9:16 (1080×1920) y mismo fondo cinematográfico
 * que «Mis sugerencias» / «Mi Resumen» (lib/shareImage.ts, de donde se
 * reutiliza el fondo/viñeteado y la carga de imágenes), para que a
 * simple vista (p. ej. en una story) se reconozca que es de la web
 * incluso antes de leer el texto.
 */

import {
  BACKDROP_FILES,
  SHARE_HEIGHT,
  SHARE_WIDTH,
  drawBackdrop,
  loadImage,
  wrapLines,
  type DrawableImage,
} from "./shareImage";
import { SITE_TAGLINE } from "./site";

export type ProfileShareOptions = {
  siteName: string;
  // URL completa que codifica el QR (el enlace de invitación)
  qrUrl: string;
  // URL corta que se muestra como texto (sin https://)
  displayUrl: string;
  username: string;
  displayName?: string | null;
  fontFamily?: string;
  logo?: DrawableImage | null;
  backdrops?: (DrawableImage | null)[];
  qr?: DrawableImage | null;
};

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

export function drawProfileShareImage(
  ctx: CanvasRenderingContext2D,
  options: ProfileShareOptions
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
  const title = "Sígueme en La Butaca Secreta";
  let titleSize = 76;

  ctx.font = `800 ${titleSize}px ${font}`;

  while (
    titleSize > 40 &&
    ctx.measureText(title).width > W - 120
  ) {
    titleSize -= 4;
    ctx.font = `800 ${titleSize}px ${font}`;
  }

  const titleW = ctx.measureText(title).width;

  const titleGradient = ctx.createLinearGradient(
    W / 2 - titleW / 2,
    0,
    W / 2 + titleW / 2,
    0
  );

  titleGradient.addColorStop(0, "#ffffff");
  titleGradient.addColorStop(0.55, "#ffffff");
  titleGradient.addColorStop(1, "#fb923c");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = titleGradient;
  ctx.fillText(title, W / 2, 468);
  ctx.restore();

  // ---------- @usuario ----------
  const handle = `@${options.username}`;

  ctx.font = `800 44px ${font}`;

  const handleW = ctx.measureText(handle).width + 56;

  roundedRect(ctx, W / 2 - handleW / 2, 500, handleW, 68, 34);
  ctx.fillStyle = "rgba(250,204,21,0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(250,204,21,0.65)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#facc15";
  ctx.fillText(handle, W / 2, 546);

  // ---------- Contexto: qué es el QR y qué hace ----------
  ctx.fillStyle = "#e4e4e7";
  ctx.font = `500 36px ${font}`;

  const explainLines = wrapLines(
    (text) => ctx.measureText(text).width,
    "Escanéalo con la cámara de tu móvil y date de alta en un momento para empezar a seguirme.",
    W - 200,
    3
  );

  const explainTop = 630;
  const explainLineH = 46;

  explainLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, explainTop + i * explainLineH);
  });

  // ---------- Tarjeta blanca con el QR ----------
  const cardSize = 600;
  const cardX = W / 2 - cardSize / 2;
  const cardY = explainTop + explainLines.length * explainLineH + 40;

  ctx.save();
  ctx.shadowColor = "rgba(251,146,60,0.45)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 12;
  roundedRect(ctx, cardX, cardY, cardSize, cardSize, 36);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  roundedRect(ctx, cardX + 2, cardY + 2, cardSize - 4, cardSize - 4, 34);
  ctx.strokeStyle = "rgba(251,146,60,0.75)";
  ctx.lineWidth = 4;
  ctx.stroke();

  const qr = options.qr;
  const qrPad = 50;
  const qrSize = cardSize - qrPad * 2;

  if (qr && qr.width > 0 && qr.height > 0) {
    ctx.drawImage(qr, cardX + qrPad, cardY + qrPad, qrSize, qrSize);
  } else {
    ctx.fillStyle = "#111111";
    ctx.font = `600 24px ${font}`;
    ctx.fillText("Código QR", cardX + cardSize / 2, cardY + cardSize / 2);
  }

  // Pequeño "escanéame" apuntando al código
  ctx.fillStyle = "#a1a1aa";
  ctx.font = `600 28px ${font}`;
  ctx.fillText("📷 Apúntale con la cámara", W / 2, cardY + cardSize + 48);

  // ---------- Pie: enlace y eslogan ----------
  ctx.font = `800 38px ${font}`;

  const pillW = ctx.measureText(options.displayUrl).width + 90;
  const pillX = W / 2 - pillW / 2;
  const footY = cardY + cardSize + 100;

  const pillGradient = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0);

  pillGradient.addColorStop(0, "#b91c1c");
  pillGradient.addColorStop(1, "#ea580c");

  ctx.save();
  ctx.shadowColor = "rgba(239,68,68,0.5)";
  ctx.shadowBlur = 30;
  roundedRect(ctx, pillX, footY, pillW, 70, 35);
  ctx.fillStyle = pillGradient;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(options.displayUrl, W / 2, footY + 48);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = `500 26px ${font}`;
  ctx.fillText(SITE_TAGLINE, W / 2, footY + 108);
}

/** Crea la imagen de "Compartir mi perfil" y la devuelve lista para compartir o descargar. */
export async function createProfileShareImage(
  options: ProfileShareOptions & { qrDataUrl: string }
): Promise<Blob> {
  const [logo, backdrops, qr] = await Promise.all([
    loadImage("/Logo.png"),
    Promise.all(BACKDROP_FILES.map((file) => loadImage(file))),
    loadImage(options.qrDataUrl),
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

  drawProfileShareImage(ctx, { ...options, logo, backdrops, qr });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}
