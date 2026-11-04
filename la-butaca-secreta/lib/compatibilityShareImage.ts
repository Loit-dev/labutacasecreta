/**
 * Dibuja la imagen de "Compatibilidad" entre dos usuarios (tarjeta
 * del perfil público) en un canvas. Mismo formato 9:16 (1080×1920) y
 * mismo fondo cinematográfico que el resto de imágenes para compartir
 * (lib/shareImage.ts), para que se reconozca de un vistazo que es de
 * la web.
 */

import {
  BACKDROP_FILES,
  SHARE_HEIGHT,
  SHARE_WIDTH,
  drawBackdrop,
  loadImage,
  type DrawableImage,
} from "./shareImage";

export type CompatibilityShareOptions = {
  siteName: string;
  siteUrl: string;
  myUsername: string;
  theirUsername: string;
  percent: number;
  icon: string;
  label: string;
  commonRatedCount: number;
  fontFamily?: string;
  logo?: DrawableImage | null;
  backdrops?: (DrawableImage | null)[];
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

function initialsOf(username: string): string {
  return username.replace(/^@/, "").slice(0, 2).toUpperCase();
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  font: string,
  centerX: number,
  centerY: number,
  radius: number,
  username: string,
  from: string,
  to: string
) {
  const gradient = ctx.createLinearGradient(
    centerX - radius,
    centerY - radius,
    centerX + radius,
    centerY + radius
  );

  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.font = `800 ${Math.round(radius * 0.62)}px ${font}`;
  ctx.textBaseline = "middle";
  ctx.fillText(initialsOf(username), centerX, centerY + radius * 0.04);
  ctx.textBaseline = "alphabetic";
}

export function drawCompatibilityShareImage(
  ctx: CanvasRenderingContext2D,
  options: CompatibilityShareOptions
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

  // ---------- Titular ("¡Gemelos de cine!", "¡Polos opuestos!"...) ----------
  const headline = `¡${options.label}!`;
  let headlineSize = 70;

  ctx.font = `800 ${headlineSize}px ${font}`;

  while (
    headlineSize > 38 &&
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

  // ---------- Avatares de los dos usuarios, con el icono de la franja en medio ----------
  const avatarY = 620;
  const avatarR = 90;
  const avatarGap = 170;

  drawAvatar(
    ctx,
    font,
    W / 2 - avatarGap,
    avatarY,
    avatarR,
    options.myUsername,
    "#f472b6",
    "#fbbf24"
  );
  drawAvatar(
    ctx,
    font,
    W / 2 + avatarGap,
    avatarY,
    avatarR,
    options.theirUsername,
    "#60a5fa",
    "#34d399"
  );

  ctx.font = `64px ${font}`;
  ctx.fillText(options.icon, W / 2, avatarY + 24);

  ctx.font = `700 34px ${font}`;
  ctx.fillStyle = "#e4e4e7";
  ctx.fillText(
    `@${options.myUsername}`,
    W / 2 - avatarGap,
    avatarY + avatarR + 52
  );
  ctx.fillText(
    `@${options.theirUsername}`,
    W / 2 + avatarGap,
    avatarY + avatarR + 52
  );

  // ---------- Porcentaje grande ----------
  const percentY = avatarY + avatarR + 220;

  ctx.font = `900 170px ${font}`;

  const percentText = `${options.percent}%`;
  const percentW = ctx.measureText(percentText).width;

  const percentGradient = ctx.createLinearGradient(
    W / 2 - percentW / 2,
    0,
    W / 2 + percentW / 2,
    0
  );

  percentGradient.addColorStop(0, "#ffffff");
  percentGradient.addColorStop(0.55, "#ffffff");
  percentGradient.addColorStop(1, "#fb923c");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 28;
  ctx.fillStyle = percentGradient;
  ctx.fillText(percentText, W / 2, percentY);
  ctx.restore();

  ctx.fillStyle = "#a1a1aa";
  ctx.font = `600 32px ${font}`;
  ctx.fillText(
    `${options.commonRatedCount} ${
      options.commonRatedCount === 1 ? "peli valorada" : "pelis valoradas"
    } por los dos`,
    W / 2,
    percentY + 60
  );

  // ---------- Pie ----------
  const url = options.siteUrl.replace(/^https?:\/\//, "");

  ctx.font = `800 40px ${font}`;

  const pillW = ctx.measureText(url).width + 90;
  const pillX = W / 2 - pillW / 2;
  const footY = SHARE_HEIGHT - 400;

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
    "¿Y tú? Mira cuánto coincides con tus amigos.",
    W / 2,
    footY + 112
  );
}

/** Crea la imagen de "Compatibilidad" y la devuelve lista para compartir o descargar. */
export async function createCompatibilityShareImage(
  options: CompatibilityShareOptions
): Promise<Blob> {
  const [logo, backdrops] = await Promise.all([
    loadImage("/Logo.png"),
    Promise.all(BACKDROP_FILES.map((file) => loadImage(file))),
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

  drawCompatibilityShareImage(ctx, { ...options, logo, backdrops });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}
