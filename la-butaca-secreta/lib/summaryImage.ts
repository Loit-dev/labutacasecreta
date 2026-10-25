/**
 * Dibuja la imagen de "Mi Resumen" (estilo wrapped) en un canvas.
 *
 * Mismo formato 9:16 (1080×1920) y mismo fondo cinematográfico que
 * «Mis sugerencias» (lib/shareImage.ts, de donde se reutiliza el
 * fondo/viñeteado y la carga de imágenes), pero con tarjetas de
 * estadísticas en vez de pósters en abanico.
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

export type SummaryTitleCard = {
  title: string;
  posterUrl?: string;
  rating?: number;
};

export type SummaryOptions = {
  siteName: string;
  siteUrl: string;
  fontFamily?: string;
  headline: string;
  monthLabel: string;
  last14: { date: string; count: number }[];
  lastWatched?: SummaryTitleCard;
  bestRated?: SummaryTitleCard;
  topGenre?: { name: string; count: number };
  leastGenre?: { name: string; count: number };
  competitiveLine?: string;
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

function glassCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  roundedRect(ctx, x, y, w, h, 28);
  ctx.fillStyle = "rgba(24,24,27,0.55)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawLineChart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  points: number[]
) {
  const max = Math.max(1, ...points);

  const stepX = w / Math.max(1, points.length - 1);

  const toY = (v: number) => y + h - (v / max) * h;

  // Área bajo la línea, muy tenue
  ctx.beginPath();
  ctx.moveTo(x, y + h);

  points.forEach((v, i) => ctx.lineTo(x + i * stepX, toY(v)));

  ctx.lineTo(x + (points.length - 1) * stepX, y + h);
  ctx.closePath();

  const fill = ctx.createLinearGradient(0, y, 0, y + h);

  fill.addColorStop(0, "rgba(251,146,60,0.35)");
  fill.addColorStop(1, "rgba(251,146,60,0)");

  ctx.fillStyle = fill;
  ctx.fill();

  // Línea
  ctx.beginPath();
  points.forEach((v, i) => {
    const px = x + i * stepX;
    const py = toY(v);

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });

  ctx.strokeStyle = "#fb923c";
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  // Puntos, con el máximo resaltado
  points.forEach((v, i) => {
    const px = x + i * stepX;
    const py = toY(v);
    const isMax = v === max && v > 0;

    ctx.beginPath();
    ctx.arc(px, py, isMax ? 10 : 6, 0, Math.PI * 2);
    ctx.fillStyle = isMax ? "#facc15" : "#fb923c";
    ctx.fill();
  });
}

export function drawSummaryImage(
  ctx: CanvasRenderingContext2D,
  posters: (DrawableImage | null)[],
  options: SummaryOptions
) {
  const font =
    options.fontFamily ||
    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  const W = SHARE_WIDTH;
  const H = SHARE_HEIGHT;

  drawBackdrop(ctx, options);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  // ---------- Logo ----------
  const logo = options.logo;

  if (logo && logo.width > 0 && logo.height > 0) {
    const logoH = 180;
    const logoW = (logo.width / logo.height) * logoH;

    ctx.drawImage(logo, W / 2 - logoW / 2, 235, logoW, logoH);
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.font = `800 34px ${font}`;
    ctx.fillText(options.siteName.toUpperCase(), W / 2, 380);
  }

  // ---------- Titular (rotativo) ----------
  let titleSize = 92;

  ctx.font = `800 ${titleSize}px ${font}`;

  while (
    titleSize > 48 &&
    ctx.measureText(options.headline).width > W - 120
  ) {
    titleSize -= 4;
    ctx.font = `800 ${titleSize}px ${font}`;
  }

  const titleW = ctx.measureText(options.headline).width;

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
  ctx.fillText(options.headline, W / 2, 505);
  ctx.restore();

  ctx.fillStyle = "#e4e4e7";
  ctx.font = `500 36px ${font}`;
  ctx.fillText(`Tu ${options.monthLabel.toLowerCase()} en ${options.siteName}`, W / 2, 560);

  // ---------- Tarjeta: línea de vistas (14 días) ----------
  const chartX = 70;
  const chartY = 610;
  const chartW = W - 140;
  const chartH = 300;

  glassCard(ctx, chartX, chartY, chartW, chartH);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 32px ${font}`;
  ctx.fillText("Vistas en los últimos 14 días", chartX + 36, chartY + 56);

  const total14 = options.last14.reduce((sum, d) => sum + d.count, 0);

  ctx.fillStyle = "#fb923c";
  ctx.font = `800 32px ${font}`;
  ctx.textAlign = "right";
  ctx.fillText(String(total14), chartX + chartW - 36, chartY + 56);

  drawLineChart(
    ctx,
    chartX + 40,
    chartY + 90,
    chartW - 80,
    chartH - 150,
    options.last14.map((d) => d.count)
  );

  ctx.textAlign = "center";

  // ---------- Tarjetas: última vista / mejor valorada ----------
  const cardY = chartY + chartH + 36;
  const cardH = 420;
  const gap = 24;
  const cardW = (chartW - gap) / 2;

  const titleCards: [SummaryTitleCard | undefined, string, DrawableImage | null][] = [
    [options.lastWatched, "ÚLTIMA VISTA", posters[0] ?? null],
    [options.bestRated, "MEJOR VALORADA", posters[1] ?? null],
  ];

  titleCards.forEach(([card, label, poster], i) => {
    const x = chartX + i * (cardW + gap);

    glassCard(ctx, x, cardY, cardW, cardH);

    ctx.textAlign = "left";
    ctx.fillStyle = "#fb923c";
    ctx.font = `800 22px ${font}`;
    ctx.fillText(label, x + 28, cardY + 44);

    if (!card) {
      ctx.fillStyle = "#a1a1aa";
      ctx.font = `500 26px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("Aún sin datos", x + cardW / 2, cardY + cardH / 2);
      ctx.textAlign = "left";
      return;
    }

    const posterW = cardW - 56;
    const posterH = cardH - 180;
    const posterX = x + 28;
    const posterY = cardY + 64;

    ctx.save();
    roundedRect(ctx, posterX, posterY, posterW, posterH, 18);
    ctx.clip();

    if (poster && poster.width > 0 && poster.height > 0) {
      const scale = Math.max(
        posterW / poster.width,
        posterH / poster.height
      );

      ctx.drawImage(
        poster,
        posterX + (posterW - poster.width * scale) / 2,
        posterY + (posterH - poster.height * scale) / 2,
        poster.width * scale,
        poster.height * scale
      );
    } else {
      ctx.fillStyle = "#27272a";
      ctx.fillRect(posterX, posterY, posterW, posterH);
    }

    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 28px ${font}`;

    const [line1 = "", line2 = ""] = wrapLines(
      (text) => ctx.measureText(text).width,
      card.title,
      cardW - 48,
      2
    );

    ctx.fillText(line1, x + cardW / 2, posterY + posterH + 42);
    if (line2) ctx.fillText(line2, x + cardW / 2, posterY + posterH + 76);

    if (card.rating) {
      ctx.fillStyle = "#facc15";
      ctx.font = `800 26px ${font}`;
      ctx.fillText(
        `★ ${card.rating}`,
        x + cardW / 2,
        posterY + posterH + (line2 ? 112 : 78)
      );
    }
  });

  // ---------- Géneros ----------
  const genreY = cardY + cardH + 36;
  const genreH = 110;

  glassCard(ctx, chartX, genreY, chartW, genreH);

  if (options.topGenre) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `600 22px ${font}`;
    ctx.fillText("GÉNERO FAVORITO", chartX + 36, genreY + 40);

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 34px ${font}`;
    ctx.fillText(options.topGenre.name, chartX + 36, genreY + 80);
  }

  if (options.leastGenre) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `600 22px ${font}`;
    ctx.fillText(
      "EL QUE MENOS VES",
      chartX + chartW - 36,
      genreY + 40
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 34px ${font}`;
    ctx.fillText(
      options.leastGenre.name,
      chartX + chartW - 36,
      genreY + 80
    );
  }

  // ---------- Toque competitivo ----------
  let footTop = genreY + genreH + 40;

  if (options.competitiveLine) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#facc15";
    ctx.font = `700 30px ${font}`;

    const [line = ""] = wrapLines(
      (text) => ctx.measureText(text).width,
      options.competitiveLine,
      chartW - 60,
      1
    );

    ctx.fillText(line, W / 2, footTop + 10);

    footTop += 60;
  }

  // ---------- Pie ----------
  const url = options.siteUrl.replace(/^https?:\/\//, "");

  ctx.font = `800 40px ${font}`;

  const pillW = ctx.measureText(url).width + 90;
  const pillX = W / 2 - pillW / 2;
  const footY = Math.min(footTop + 20, 1520);

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
    "¿No sabes qué ver? Te recomiendo solo tres.",
    W / 2,
    footY + 112
  );
}

/** Crea la imagen de "Mi Resumen" y la devuelve lista para compartir o descargar. */
export async function createSummaryImage(
  options: SummaryOptions
): Promise<Blob> {
  const [posterLast, posterBest, logo, backdrops] = await Promise.all([
    loadImage(options.lastWatched?.posterUrl),
    loadImage(options.bestRated?.posterUrl),
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

  drawSummaryImage(ctx, [posterLast, posterBest], {
    ...options,
    logo,
    backdrops,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}
