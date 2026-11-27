/**
 * Segunda imagen de cierre del Resumen Anual ("Wrapped"): mismo
 * formato y fondo que lib/wrappedShareImage.ts (para que se reconozca
 * como "parte 2" de la misma serie), pero con los datos que NO salen
 * en la primera — El Canon, películas vs. series, el día que más
 * viste, lo que descartaste ("No me apetece") y lo que lleva más
 * tiempo esperando en tu lista. La primera imagen ya iba cargada
 * (pósters + géneros + logros + cifras + comunidad + grupo), así que
 * esto es una tarjeta aparte en vez de intentar meterlo todo en una.
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

export type WrappedShareExtraOptions = {
  siteName: string;
  siteUrl: string;
  year: number;
  displayName?: string;
  movieCount: number;
  seriesCount: number;
  /** El Canon (data/canon/canon250.ts): progreso acumulado de siempre, no solo de este año. */
  canonTotalProgress: number;
  canonTotal: number;
  canonThisYear: number;
  /** Racha de días consecutivos más larga del año (WrappedStats.longestStreak) — se repite aquí junto al día pico porque ambos hablan de "cuánto viste de seguido". */
  longestStreak: number;
  /** Día con más títulos vistos a la vez (WrappedStats.peakDay). */
  peakDay?: { date: string; count: number; titles: string[] };
  /** "No me apetece" descartados dentro del año del resumen. */
  rejectedThisYearCount: number;
  /** El título que más tiempo lleva en "Mi lista" ahora mismo. */
  oldestPendingTitle?: string;
  oldestPendingMonths?: number;
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

const MONTH_NAMES_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatDay(dateKey: string): string {
  const [, month, day] = dateKey.split("-").map(Number);

  if (!month || !day) return dateKey;

  return `${day} de ${MONTH_NAMES_LONG[month - 1]}`;
}

export function drawWrappedShareImageExtra(
  ctx: CanvasRenderingContext2D,
  options: WrappedShareExtraOptions
) {
  const font =
    options.fontFamily ||
    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  const W = SHARE_WIDTH;
  const gridX = 70;
  const gridW = W - 140;
  const statsGap = 14;

  drawBackdrop(ctx, options);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  // ---------- Logo ----------
  const logo = options.logo;

  if (logo && logo.width > 0 && logo.height > 0) {
    const logoH = 120;
    const logoW = (logo.width / logo.height) * logoH;

    ctx.drawImage(logo, W / 2 - logoW / 2, 110, logoW, logoH);
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.font = `800 30px ${font}`;
    ctx.fillText(options.siteName.toUpperCase(), W / 2, 190);
  }

  // ---------- Titular: más sencillo que el de la primera imagen (sin
  // mezclar tamaños), para dejar claro que esto es la "parte 2". ----------
  const headline = options.displayName
    ? `MÁS DEL ${options.year} DE ${options.displayName.toUpperCase()}`
    : `MÁS DE MI ${options.year} EN CINE.`;

  let titleSize = 56;

  ctx.font = `900 ${titleSize}px ${font}`;

  while (titleSize > 30 && ctx.measureText(headline).width > W - 110) {
    titleSize -= 2;
    ctx.font = `900 ${titleSize}px ${font}`;
  }

  const titleTop = 258;
  const titleBaselineY = titleTop + titleSize * 0.8;
  const headlineWidth = ctx.measureText(headline).width;

  const gradient = ctx.createLinearGradient(
    W / 2 - headlineWidth / 2,
    0,
    W / 2 + headlineWidth / 2,
    0
  );

  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.55, "#ffffff");
  gradient.addColorStop(1, "#fb923c");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = gradient;
  ctx.fillText(headline, W / 2, titleBaselineY);
  ctx.restore();

  const titleBottom = titleBaselineY;

  ctx.fillStyle = "#e4e4e7";
  ctx.font = `500 32px ${font}`;
  ctx.fillText(
    `${options.siteName} · Resumen ${options.year} · Parte 2`,
    W / 2,
    titleBottom + 52
  );

  // ---------- El Canon ----------
  let afterCanonY = titleBottom + 110;

  if (options.canonTotal > 0) {
    const canonTop = titleBottom + 110;
    const cardPad = 40;
    const cardH = 280;

    roundedRect(ctx, gridX, canonTop, gridW, cardH, 28);
    ctx.fillStyle = "rgba(24,24,27,0.6)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `700 24px ${font}`;
    ctx.fillText("EL CANON", gridX + cardPad, canonTop + 54);

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 64px ${font}`;
    ctx.fillText(
      `${options.canonTotalProgress} / ${options.canonTotal}`,
      gridX + cardPad,
      canonTop + 122
    );

    ctx.fillStyle = "#fde68a";
    ctx.font = `800 26px ${font}`;
    ctx.fillText(
      `+${options.canonThisYear} películas este año`,
      gridX + cardPad,
      canonTop + 156
    );

    // Barra de progreso
    const barY = canonTop + 182;
    const barH = 22;
    const barW = gridW - cardPad * 2;
    const pct = Math.min(
      1,
      options.canonTotal > 0
        ? options.canonTotalProgress / options.canonTotal
        : 0
    );

    roundedRect(ctx, gridX + cardPad, barY, barW, barH, barH / 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();

    if (pct > 0) {
      ctx.save();
      roundedRect(ctx, gridX + cardPad, barY, barW, barH, barH / 2);
      ctx.clip();

      const fillW = Math.max(barH, pct * barW);
      const barGradient = ctx.createLinearGradient(
        gridX + cardPad,
        0,
        gridX + cardPad + fillW,
        0
      );

      barGradient.addColorStop(0, "#dc2626");
      barGradient.addColorStop(1, "#f59e0b");
      ctx.fillStyle = barGradient;
      ctx.fillRect(gridX + cardPad, barY, fillW, barH);
      ctx.restore();
    }

    const canonRemaining = options.canonTotal - options.canonTotalProgress;
    const canonYearsLeft =
      canonRemaining > 0 && options.canonThisYear > 0
        ? Math.ceil(canonRemaining / options.canonThisYear)
        : null;

    ctx.fillStyle = "#d4d4d8";
    ctx.font = `600 22px ${font}`;
    ctx.fillText(
      canonYearsLeft !== null
        ? `📚 A este ritmo, lo terminas en ${
            canonYearsLeft === 1 ? "1 año más" : `${canonYearsLeft} años más`
          }.`
        : "📚 El Canon: las 250 películas que toda cinéfila debería ver.",
      gridX + cardPad,
      barY + barH + 36
    );

    ctx.textAlign = "center";
    afterCanonY = canonTop + cardH;
  }

  // ---------- Películas vs. series ----------
  const splitY = afterCanonY + 36;
  const splitH = 140;
  const splitCols = 2;
  const splitW = (gridW - statsGap * (splitCols - 1)) / splitCols;

  const split: [string, string, string][] = [
    ["PELÍCULAS", String(options.movieCount), "#ffffff"],
    ["SERIES", String(options.seriesCount), "#93c5fd"],
  ];

  split.forEach(([label, value, color], i) => {
    const x = gridX + i * (splitW + statsGap);

    glassCard(ctx, x, splitY, splitW, splitH);

    ctx.textAlign = "center";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `700 20px ${font}`;
    ctx.fillText(label, x + splitW / 2, splitY + 42);

    ctx.fillStyle = color;
    ctx.font = `800 48px ${font}`;
    ctx.fillText(value, x + splitW / 2, splitY + 102);
  });

  let afterSplitY = splitY + splitH;

  // ---------- Día más visto + racha ----------
  if (options.peakDay) {
    const pillTop = afterSplitY + 32;
    const padX = 44;

    ctx.font = `700 28px ${font}`;

    const lines = wrapLines(
      (text) => ctx.measureText(text).width,
      `🎬 Tu día más visto: ${formatDay(options.peakDay.date)}, con ${
        options.peakDay.count
      } títulos de golpe.`,
      gridW - padX * 2,
      2
    );

    const lineH = 38;
    const pillH = 40 + lines.length * lineH;

    roundedRect(ctx, gridX, pillTop, gridW, pillH, 24);
    ctx.fillStyle = "rgba(147,197,253,0.14)";
    ctx.fill();
    ctx.strokeStyle = "rgba(147,197,253,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#bfdbfe";

    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, pillTop + 38 + i * lineH);
    });

    afterSplitY = pillTop + pillH;
  }

  // ---------- Descartados / pendiente ----------
  const tilesY = afterSplitY + 32;
  const tilesH = 120;

  const tiles: [string, string, string][] = [
    [
      "RACHA MÁS LARGA",
      options.longestStreak > 0 ? `${options.longestStreak} días` : "—",
      "#fdba74",
    ],
    [
      "DESCARTADOS",
      options.rejectedThisYearCount > 0
        ? String(options.rejectedThisYearCount)
        : "—",
      "#fca5a5",
    ],
  ];

  const tilesCols = tiles.length;
  const tilesW = (gridW - statsGap * (tilesCols - 1)) / tilesCols;

  tiles.forEach(([label, value, color], i) => {
    const x = gridX + i * (tilesW + statsGap);

    glassCard(ctx, x, tilesY, tilesW, tilesH);

    ctx.textAlign = "center";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `700 18px ${font}`;

    const labelLines = wrapLines(
      (text) => ctx.measureText(text).width,
      label,
      tilesW - 24,
      2
    );

    labelLines.forEach((labelLine, li) => {
      ctx.fillText(labelLine, x + tilesW / 2, tilesY + 32 + li * 22);
    });

    ctx.fillStyle = color;
    ctx.font = `800 36px ${font}`;
    ctx.fillText(value, x + tilesW / 2, tilesY + tilesH - 24);
  });

  let afterTilesY = tilesY + tilesH;

  // ---------- Pendiente desde hace tiempo ----------
  if (options.oldestPendingTitle && options.oldestPendingMonths !== undefined) {
    const cardTop = afterTilesY + 32;
    const padX = 44;

    ctx.font = `700 28px ${font}`;

    const monthsText =
      options.oldestPendingMonths === 1
        ? "1 mes"
        : `${options.oldestPendingMonths} meses`;

    const lines = wrapLines(
      (text) => ctx.measureText(text).width,
      `📌 Llevas ${monthsText} con «${options.oldestPendingTitle}» esperando en tu lista.`,
      gridW - padX * 2,
      2
    );

    const lineH = 38;
    const cardH = 40 + lines.length * lineH;

    roundedRect(ctx, gridX, cardTop, gridW, cardH, 24);

    const cardGradient = ctx.createLinearGradient(gridX, 0, gridX + gridW, 0);

    cardGradient.addColorStop(0, "rgba(251,191,36,0.18)");
    cardGradient.addColorStop(1, "rgba(251,146,60,0.14)");
    ctx.fillStyle = cardGradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(252,211,77,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fde68a";

    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, cardTop + 38 + i * lineH);
    });

    afterTilesY = cardTop + cardH;
  }

  // ---------- Pie ----------
  const url = options.siteUrl.replace(/^https?:\/\//, "");

  ctx.font = `800 40px ${font}`;

  const pillW = ctx.measureText(url).width + 90;
  const pillX = W / 2 - pillW / 2;
  const footY = afterTilesY + 60;

  const pillGradient = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0);

  pillGradient.addColorStop(0, "#b91c1c");
  pillGradient.addColorStop(1, "#ea580c");

  ctx.save();
  ctx.shadowColor = "rgba(239,68,68,0.5)";
  ctx.shadowBlur = 30;
  roundedRect(ctx, pillX, footY, pillW, 68, 34);
  ctx.fillStyle = pillGradient;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(url, W / 2, footY + 47);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = `500 28px ${font}`;
  ctx.fillText("Tu año de cine, de principio a fin.", W / 2, footY + 100);
}

/** Crea la segunda imagen de cierre del Resumen Anual ("parte 2"). */
export async function createWrappedShareImageExtra(
  options: WrappedShareExtraOptions
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

  drawWrappedShareImageExtra(ctx, { ...options, logo, backdrops });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}
