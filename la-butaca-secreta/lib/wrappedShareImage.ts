/**
 * Dibuja la imagen de cierre del Resumen Anual ("Wrapped") en un
 * canvas: mismo formato 9:16 (1080×1920) y mismo fondo cinematográfico
 * que el resto de imágenes para compartir de la web (lib/shareImage.ts,
 * de donde se reutiliza el fondo/viñeteado y la carga de imágenes),
 * para que se reconozca de un vistazo que es de la web. En vez del
 * muro de 8 pósters, 3 "destacados" (mejor valorada, última vista,
 * primera del año) con su etiqueta encima; debajo, un gráfico de
 * barras con los géneros favoritos (no un calendario de 12 meses: con
 * una web que lleva solo un par de meses, un gráfico mes a mes sale
 * casi vacío y no cuenta nada; el reparto por género sí tiene sentido
 * desde el primer día); luego hasta 3 medallas de los logros
 * destacados del año (mismos colores de nivel que components/
 * achievements/Medal.tsx, simplificados a un círculo — sin la gema de
 * Diamante — para que se puedan dibujar en canvas); dos filas de
 * cifras (títulos/género/racha y horas de pantalla/logros); y el
 * "dato curioso" de comparativa con la comunidad como tarjeta (no
 * texto suelto), con el mismo tratamiento de más presencia que el
 * resto del Resumen.
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
import { yearCommunityLine } from "./wrappedExtras";

export type SpotlightPoster = {
  url: string;
  /** Etiqueta corta sobre el póster, p. ej. "Mejor valorada". */
  label: string;
  /** Detalle opcional bajo la etiqueta (fecha, estrellas…). */
  detail?: string;
};

export type ShareGenreShare = {
  name: string;
  percent: number;
};

export type ShareAchievementHighlight = {
  familyName: string;
  tierName: string;
  /** 1 (Bronce) a 5 (Diamante) — igual que Tier en lib/achievements/catalog.ts, sin el 0 (no empezado). */
  level: number;
};

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
  /** Datos de my_year_rank (supabase/resumen.sql) para el "dato curioso" de comparativa con la comunidad; sin los tres, se omite esa tarjeta. */
  communityPercentile?: number;
  communityTotalUsers?: number;
  communityMine?: number;
  /** Top géneros del año (WrappedStats.topGenres), ya ordenados de más a menos, para el gráfico de barras. */
  topGenres?: ShareGenreShare[];
  /** Hasta 3 logros destacados del año (WrappedStats.achievementsThisYear), más reciente primero. */
  achievementHighlights?: ShareAchievementHighlight[];
  /** Hasta 3 pósters destacados (no el muro completo), con su etiqueta. */
  spotlightPosters: SpotlightPoster[];
  fontFamily?: string;
  logo?: DrawableImage | null;
  backdrops?: (DrawableImage | null)[];
  /** Imágenes ya cargadas de spotlightPosters, mismo orden (las rellena createWrappedShareImage). */
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

// Mismos degradados de nivel que components/achievements/Medal.tsx
// (TIER_STYLE) — no cambiar sin actualizar ese componente también.
// Simplificado a un círculo (sin la gema hexagonal de Diamante) por
// ser más sencillo de dibujar en canvas.
const TIER_MEDAL_STYLE: Record<
  number,
  { from: string; to: string; border: string; glyph: string; label: string }
> = {
  1: {
    from: "#fb923c",
    to: "#9a3412",
    border: "rgba(251,146,60,0.7)",
    glyph: "#ffffff",
    label: "#fb923c",
  },
  2: {
    from: "#f4f4f5",
    to: "#a1a1aa",
    border: "rgba(228,228,231,0.7)",
    glyph: "#1c1917",
    label: "#e4e4e7",
  },
  3: {
    from: "#fde047",
    to: "#ca8a04",
    border: "rgba(250,204,21,0.7)",
    glyph: "#1c1917",
    label: "#facc15",
  },
  4: {
    from: "#f0f9ff",
    to: "#7dd3fc",
    border: "rgba(125,211,252,0.75)",
    glyph: "#0c4a6e",
    label: "#7dd3fc",
  },
  5: {
    from: "#f5f3ff",
    to: "#67e8f9",
    border: "rgba(196,181,253,0.8)",
    glyph: "#312e81",
    label: "#c4b5fd",
  },
};

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

  // ---------- Pósters destacados (3, no el muro completo) ----------
  const gridX = 70;
  const gridW = W - 140;
  const spotlightTop = titleBottom + 72;
  const spotlightGap = 20;
  const spotlightPosters = options.spotlightPosters;
  const spotlightCount = spotlightPosters.length;
  // El tamaño de cada póster se calcula siempre a 3 columnas, aunque
  // haya menos (cuentas nuevas con pocos títulos vistos): si no, un
  // único póster ocuparía todo el ancho y saldría desproporcionado,
  // empujando el resto de la imagen mucho más abajo.
  const SPOTLIGHT_REFERENCE_COLS = 3;
  const spotlightW =
    (gridW - spotlightGap * (SPOTLIGHT_REFERENCE_COLS - 1)) /
    SPOTLIGHT_REFERENCE_COLS;
  const posterH = spotlightCount > 0 ? spotlightW * 1.4 : 0;
  const spotlightRowW =
    spotlightCount * spotlightW + (spotlightCount - 1) * spotlightGap;
  const spotlightRowX = gridX + (gridW - spotlightRowW) / 2;

  const loadedPosters = options.posters ?? [];

  spotlightPosters.forEach((pick, i) => {
    const x = spotlightRowX + i * (spotlightW + spotlightGap);
    const y = spotlightTop;
    const poster = loadedPosters[i];

    ctx.save();
    roundedRect(ctx, x, y, spotlightW, posterH, 20);
    ctx.clip();

    if (poster && poster.width > 0 && poster.height > 0) {
      const scale = Math.max(spotlightW / poster.width, posterH / poster.height);

      ctx.drawImage(
        poster,
        x + spotlightW / 2 - (poster.width * scale) / 2,
        y + posterH / 2 - (poster.height * scale) / 2,
        poster.width * scale,
        poster.height * scale
      );
    } else {
      const fallback = ctx.createLinearGradient(0, y, 0, y + posterH);

      fallback.addColorStop(0, "#27272a");
      fallback.addColorStop(1, "#18181b");

      ctx.fillStyle = fallback;
      ctx.fillRect(x, y, spotlightW, posterH);
    }

    // Sombreado inferior para que la etiqueta se lea encima del póster.
    const shadeH = 104;
    const shade = ctx.createLinearGradient(
      0,
      y + posterH - shadeH,
      0,
      y + posterH
    );

    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = shade;
    ctx.fillRect(x, y + posterH - shadeH, spotlightW, shadeH);

    ctx.restore();

    roundedRect(ctx, x + 1, y + 1, spotlightW - 2, posterH - 2, 20);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#fcd34d";
    ctx.font = `800 19px ${font}`;

    const [labelLine = pick.label] = wrapLines(
      (text) => ctx.measureText(text).width,
      pick.label.toUpperCase(),
      spotlightW - 20,
      1
    );

    ctx.fillText(labelLine, x + spotlightW / 2, y + posterH - 56);

    if (pick.detail) {
      ctx.fillStyle = "#e4e4e7";
      ctx.font = `600 18px ${font}`;
      ctx.fillText(pick.detail, x + spotlightW / 2, y + posterH - 28);
    }
  });

  const spotlightBottom = spotlightTop + posterH;

  // ---------- Gráfico: géneros favoritos ----------
  let chartBottom = spotlightBottom;

  // Como mucho 3 (no los 5 de la pantalla en vivo): con los pósters, el
  // gráfico y encima las medallas, no sobra alto para más filas.
  const topGenres = (options.topGenres ?? []).slice(0, 3);

  if (topGenres.length > 0) {
    const chartTop = spotlightBottom + 36;
    const rowH = 50;
    const rowGap = 12;
    const maxPercent = Math.max(...topGenres.map((g) => g.percent), 1);

    ctx.textAlign = "center";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `700 22px ${font}`;
    ctx.fillText("TUS GÉNEROS FAVORITOS", W / 2, chartTop - 18);

    topGenres.forEach((genre, i) => {
      const y = chartTop + i * (rowH + rowGap);

      roundedRect(ctx, gridX, y, gridW, rowH, rowH / 2);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();

      const fillW = Math.max(rowH, (genre.percent / maxPercent) * gridW);

      ctx.save();
      roundedRect(ctx, gridX, y, gridW, rowH, rowH / 2);
      ctx.clip();

      const barGradient = ctx.createLinearGradient(gridX, 0, gridX + fillW, 0);

      if (i === 0) {
        barGradient.addColorStop(0, "#dc2626");
        barGradient.addColorStop(1, "#f59e0b");
      } else {
        barGradient.addColorStop(0, "rgba(220,38,38,0.38)");
        barGradient.addColorStop(1, "rgba(251,146,60,0.5)");
      }

      ctx.fillStyle = barGradient;
      ctx.fillRect(gridX, y, fillW, rowH);
      ctx.restore();

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 24px ${font}`;

      const [genreLine = genre.name] = wrapLines(
        (text) => ctx.measureText(text).width,
        genre.name,
        gridW - 150,
        1
      );

      ctx.fillText(genreLine, gridX + 24, y + rowH / 2 + 8);

      ctx.textAlign = "right";
      ctx.fillStyle = i === 0 ? "#fde68a" : "#d4d4d8";
      ctx.font = `800 22px ${font}`;
      ctx.fillText(
        `${Math.round(genre.percent)}%`,
        gridX + gridW - 24,
        y + rowH / 2 + 7
      );
    });

    ctx.textAlign = "center";

    chartBottom =
      chartTop + topGenres.length * rowH + (topGenres.length - 1) * rowGap;
  }

  // ---------- Medallas de logros destacados ----------
  let medalsBottom = chartBottom;

  const achievementHighlights = (options.achievementHighlights ?? []).slice(
    0,
    3
  );

  if (achievementHighlights.length > 0) {
    const medalsTop = chartBottom + 28;
    const medalSize = 70;
    // Igual que los pósters: el tamaño de cada medalla se calcula
    // siempre a 3 columnas y se centran las que haya, para que una
    // cuenta con solo 1-2 logros este año no salga desproporcionada.
    const MEDAL_REFERENCE_COLS = 3;
    const colW = gridW / MEDAL_REFERENCE_COLS;
    const rowW = achievementHighlights.length * colW;
    const rowX = gridX + (gridW - rowW) / 2;

    ctx.textAlign = "center";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `700 22px ${font}`;
    ctx.fillText("TUS LOGROS DESTACADOS", W / 2, medalsTop - 18);

    const circleY = medalsTop + medalSize / 2;

    achievementHighlights.forEach((highlight, i) => {
      const cx = rowX + i * colW + colW / 2;
      const style = TIER_MEDAL_STYLE[highlight.level] ?? TIER_MEDAL_STYLE[1];

      const medalGradient = ctx.createLinearGradient(
        cx - medalSize / 2,
        circleY - medalSize / 2,
        cx + medalSize / 2,
        circleY + medalSize / 2
      );

      medalGradient.addColorStop(0, style.from);
      medalGradient.addColorStop(1, style.to);

      ctx.save();
      ctx.shadowColor = style.border;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx, circleY, medalSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = medalGradient;
      ctx.fill();
      ctx.restore();

      ctx.lineWidth = 3;
      ctx.strokeStyle = style.border;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = style.glyph;
      ctx.font = `800 ${Math.round(medalSize * 0.44)}px ${font}`;
      ctx.fillText("★", cx, circleY + 2);
      ctx.textBaseline = "alphabetic";

      ctx.fillStyle = style.label;
      ctx.font = `800 19px ${font}`;
      ctx.fillText(
        highlight.tierName.toUpperCase(),
        cx,
        circleY + medalSize / 2 + 26
      );

      ctx.fillStyle = "#d4d4d8";
      ctx.font = `600 17px ${font}`;

      const [familyLine = highlight.familyName] = wrapLines(
        (text) => ctx.measureText(text).width,
        highlight.familyName,
        colW - 12,
        1
      );

      ctx.fillText(familyLine, cx, circleY + medalSize / 2 + 46);
    });

    medalsBottom = circleY + medalSize / 2 + 46 + 12;
  }

  // ---------- Lo más importante: 3 cifras ----------
  const statsY = medalsBottom + 24;
  const statsGap = 14;
  const statsCols = 3;
  const statsW = (gridW - statsGap * (statsCols - 1)) / statsCols;
  const statsH = 140;

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
  const stats2Y = statsY + statsH + 10;
  const stats2Cols = 2;
  const stats2W = (gridW - statsGap * (stats2Cols - 1)) / stats2Cols;
  const stats2H = 120;

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

  // ---------- Comparativa con la comunidad ----------
  const communityLine =
    options.communityPercentile !== undefined &&
    options.communityTotalUsers !== undefined &&
    options.communityMine !== undefined
      ? yearCommunityLine(
          options.communityPercentile,
          options.communityTotalUsers,
          options.communityMine
        )
      : undefined;

  let afterStatsY = stats2Y + stats2H;

  if (communityLine) {
    const cardTop = afterStatsY + 18;
    const cardPadX = 44;

    ctx.font = `800 30px ${font}`;

    const lines = wrapLines(
      (text) => ctx.measureText(text).width,
      `📊 ${communityLine}.`,
      gridW - cardPadX * 2,
      2
    );

    const lineH = 40;
    const cardH = 44 + lines.length * lineH;

    roundedRect(ctx, gridX, cardTop, gridW, cardH, 26);

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
      ctx.fillText(line, W / 2, cardTop + 42 + i * lineH);
    });

    afterStatsY = cardTop + cardH;
  }

  // ---------- Pie ----------
  const url = options.siteUrl.replace(/^https?:\/\//, "");

  ctx.font = `800 40px ${font}`;

  const pillW = ctx.measureText(url).width + 90;
  const pillX = W / 2 - pillW / 2;
  const footY = afterStatsY + 40;

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
    Promise.all(options.spotlightPosters.map((pick) => loadImage(pick.url))),
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
