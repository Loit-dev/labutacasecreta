/**
 * Dibuja la imagen de cierre del Resumen Anual ("Wrapped") en un
 * canvas: mismo formato 9:16 (1080×1920) y mismo fondo cinematográfico
 * que el resto de imágenes para compartir de la web (lib/shareImage.ts,
 * de donde se reutiliza el fondo/viñeteado y la carga de imágenes),
 * para que se reconozca de un vistazo que es de la web. Dos filas de
 * cifras: títulos/género/racha (lo primero que se ve) y, debajo, horas
 * de pantalla y logros — más contexto sin meter todas las cifras del
 * Resumen. El muro de pósters baja de 3 a 2 filas para hacerle sitio.
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

export type WrappedShareOptions = {
  siteName: string;
  siteUrl: string;
  year: number;
  displayName?: string;
  totalWatched: number;
  topGenreName?: string;
  longestStreak: number;
  /** Horas aprox. de pantalla este año (estimación, ver lib/wrapped.ts). */
  approxHours?: number;
  /** Insignias desbloqueadas de siempre (no solo este año). */
  achievementsTotalUnlocked?: number;
  posterUrls: string[];
  fontFamily?: string;
  logo?: DrawableImage | null;
  backdrops?: (DrawableImage | null)[];
  posters?: (DrawableImage | null)[];
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

export function drawWrappedShareImage(
  ctx: CanvasRenderingContext2D,
  options: WrappedShareOptions
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
    const logoH = 120;
    const logoW = (logo.width / logo.height) * logoH;

    ctx.drawImage(logo, W / 2 - logoW / 2, 110, logoW, logoH);
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.font = `800 30px ${font}`;
    ctx.fillText(options.siteName.toUpperCase(), W / 2, 190);
  }

  // ---------- Titular ----------
  const headline = options.displayName
    ? `El año de\n${options.displayName} en cine.`
    : `Mi ${options.year}\nen cine.`;

  const headlineLines = headline.split("\n");

  let titleSize = 84;

  ctx.font = `800 ${titleSize}px ${font}`;

  const widestLine = () =>
    Math.max(...headlineLines.map((line) => ctx.measureText(line).width));

  while (titleSize > 48 && widestLine() > W - 140) {
    titleSize -= 4;
    ctx.font = `800 ${titleSize}px ${font}`;
  }

  const titleLineH = titleSize * 1.05;
  const titleTop = 320;

  headlineLines.forEach((line, i) => {
    const lineW = ctx.measureText(line).width;

    const gradient = ctx.createLinearGradient(
      W / 2 - lineW / 2,
      0,
      W / 2 + lineW / 2,
      0
    );

    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.55, "#ffffff");
    gradient.addColorStop(1, "#fb923c");

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = gradient;
    ctx.fillText(line, W / 2, titleTop + i * titleLineH);
    ctx.restore();
  });

  const titleBottom = titleTop + (headlineLines.length - 1) * titleLineH;

  ctx.fillStyle = "#e4e4e7";
  ctx.font = `500 32px ${font}`;
  ctx.fillText(
    `${options.siteName} · Resumen ${options.year}`,
    W / 2,
    titleBottom + 52
  );

  // ---------- Muro de pósters del año ----------
  // 2 filas (no 3): deja sitio para la segunda fila de cifras de más
  // abajo sin que la imagen necesite crecer de alto.
  const gridTop = titleBottom + 110;
  const gridX = 70;
  const gridW = W - 140;
  const cols = 4;
  const rows = 2;
  const gap = 14;
  const cellW = (gridW - gap * (cols - 1)) / cols;
  const cellH = cellW * 1.5;

  const posters = (options.posters ?? []).slice(0, cols * rows);

  posters.forEach((poster, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gridX + col * (cellW + gap);
    const y = gridTop + row * (cellH + gap);

    ctx.save();
    roundedRect(ctx, x, y, cellW, cellH, 16);
    ctx.clip();

    if (poster && poster.width > 0 && poster.height > 0) {
      const scale = Math.max(cellW / poster.width, cellH / poster.height);

      ctx.drawImage(
        poster,
        x + cellW / 2 - (poster.width * scale) / 2,
        y + cellH / 2 - (poster.height * scale) / 2,
        poster.width * scale,
        poster.height * scale
      );
    } else {
      const fallback = ctx.createLinearGradient(0, y, 0, y + cellH);

      fallback.addColorStop(0, "#27272a");
      fallback.addColorStop(1, "#18181b");

      ctx.fillStyle = fallback;
      ctx.fillRect(x, y, cellW, cellH);
    }

    ctx.restore();

    roundedRect(ctx, x + 1, y + 1, cellW - 2, cellH - 2, 16);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  const gridBottom = gridTop + rows * cellH + (rows - 1) * gap;

  // ---------- Lo más importante: 3 cifras ----------
  const statsY = gridBottom + 36;
  const statsGap = 14;
  const statsCols = 3;
  const statsW = (gridW - statsGap * (statsCols - 1)) / statsCols;
  const statsH = 150;

  const stats: [string, string, string][] = [
    ["TÍTULOS", String(options.totalWatched), "#ffffff"],
    [
      "TU GÉNERO",
      options.topGenreName ?? "—",
      "#facc15",
    ],
    [
      "RACHA 🔥",
      options.longestStreak > 0 ? String(options.longestStreak) : "—",
      "#fdba74",
    ],
  ];

  stats.forEach(([label, value, color], i) => {
    const x = gridX + i * (statsW + statsGap);

    glassCard(ctx, x, statsY, statsW, statsH);

    ctx.textAlign = "center";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `700 20px ${font}`;
    ctx.fillText(label, x + statsW / 2, statsY + 42);

    ctx.fillStyle = color;
    ctx.font = `800 44px ${font}`;

    const [line = value] = wrapLines(
      (text) => ctx.measureText(text).width,
      value,
      statsW - 20,
      1
    );

    ctx.fillText(line, x + statsW / 2, statsY + 100);
  });

  // ---------- Segunda fila: horas de pantalla y logros ----------
  const stats2Y = statsY + statsH + 14;
  const stats2Cols = 2;
  const stats2W = (gridW - statsGap * (stats2Cols - 1)) / stats2Cols;
  const stats2H = 130;

  const stats2: [string, string, string][] = [
    [
      "HORAS DE PANTALLA (APROX)",
      options.approxHours ? `~${options.approxHours}h` : "—",
      "#93c5fd",
    ],
    [
      "LOGROS DESBLOQUEADOS",
      options.achievementsTotalUnlocked
        ? String(options.achievementsTotalUnlocked)
        : "—",
      "#fde68a",
    ],
  ];

  stats2.forEach(([label, value, color], i) => {
    const x = gridX + i * (stats2W + statsGap);

    glassCard(ctx, x, stats2Y, stats2W, stats2H);

    ctx.textAlign = "center";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `700 18px ${font}`;

    const labelLines = wrapLines(
      (text) => ctx.measureText(text).width,
      label,
      stats2W - 24,
      2
    );

    labelLines.forEach((labelLine, li) => {
      ctx.fillText(labelLine, x + stats2W / 2, stats2Y + 34 + li * 24);
    });

    ctx.fillStyle = color;
    ctx.font = `800 40px ${font}`;
    ctx.fillText(value, x + stats2W / 2, stats2Y + stats2H - 24);
  });

  // ---------- Pie ----------
  const url = options.siteUrl.replace(/^https?:\/\//, "");

  ctx.font = `800 40px ${font}`;

  const pillW = ctx.measureText(url).width + 90;
  const pillX = W / 2 - pillW / 2;
  const footY = stats2Y + stats2H + 60;

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
  ctx.fillText("¿No sabes qué ver? Te recomiendo solo tres.", W / 2, footY + 100);
}

/** Crea la imagen de cierre del Resumen Anual y la devuelve lista para compartir o descargar. */
export async function createWrappedShareImage(
  options: WrappedShareOptions
): Promise<Blob> {
  const [posters, logo, backdrops] = await Promise.all([
    Promise.all(options.posterUrls.map((url) => loadImage(url))),
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

  drawWrappedShareImage(ctx, { ...options, posters, logo, backdrops });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}
