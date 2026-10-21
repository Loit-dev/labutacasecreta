/**
 * Dibuja la imagen «Mis sugerencias» (3 pósters) en un canvas.
 *
 * Formato 4:5 (1080×1350): se ve bien en WhatsApp, Instagram,
 * Telegram o cualquier red. Esta función no depende de React ni de
 * Next, así que se puede probar en un navegador de pruebas.
 */

import type { ShareItem, ShareKind } from "./share";

export const SHARE_WIDTH = 1080;
export const SHARE_HEIGHT = 1350;

export type DrawableImage = CanvasImageSource & {
  width: number;
  height: number;
};

type Options = {
  kind: ShareKind;
  siteName: string;
  siteUrl: string;
  fontFamily?: string;
  // Para quién son las sugerencias ("Ana y Luis"); sin esto, "Mis sugerencias"
  audience?: string;
  // Logo de la web y pósters de fondo (los mismos que usa la web)
  logo?: DrawableImage | null;
  backdrops?: (DrawableImage | null)[];
};

// Pósters decorativos del fondo: (x, y, ancho, alto, giro en grados)
const BACKDROP_SLOTS: [number, number, number, number, number][] = [
  [-70, 30, 380, 540, -10],
  [-60, 560, 380, 540, 6],
  [-80, 1000, 380, 540, -6],
  [770, 10, 380, 540, 10],
  [780, 540, 380, 540, -6],
  [760, 1010, 380, 540, 8],
];

// Pósters del fondo (los mismos que decoran la web)
const BACKDROP_FILES = [
  "/share/dune.jpg",
  "/share/dark.jpg",
  "/share/thebear.jpg",
  "/share/interstellar.jpg",
  "/share/shogun.jpg",
  "/share/lastofus.jpg",
];

const POSTER_W = 300;
const POSTER_H = 450;
const GAP = 30;

const ROLES = {
  first: { label: "MI APUESTA", color: "#facc15" },
  second: { label: "OTRA OPCIÓN", color: "#e4e4e7" },
  surprise: { label: "SORPRESA", color: "#fb923c" },
} as const;

function roleOf(
  item: ShareItem,
  mainsBefore: number
): (typeof ROLES)[keyof typeof ROLES] {
  if (item.role === "surprise") return ROLES.surprise;

  return mainsBefore === 0 ? ROLES.first : ROLES.second;
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

/** Parte un texto en líneas que quepan en `maxWidth` (con «…» si no cabe). */
export function wrapLines(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0 || maxLines < 1) return [];

  const lines: string[] = [];

  let line = "";

  let i = 0;

  for (; i < words.length; i++) {
    const candidate = line ? `${line} ${words[i]}` : words[i];

    if (!line || measure(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }

    // La última línea admite todo lo que quede (y se recorta si no cabe)
    if (lines.length === maxLines - 1) break;

    lines.push(line);
    line = words[i];
  }

  let last =
    i < words.length
      ? `${line} ${words.slice(i).join(" ")}`
      : line;

  if (measure(last) > maxWidth) {
    while (last.length > 1 && measure(`${last}…`) > maxWidth) {
      last = last.slice(0, -1);
    }

    last = `${last.trimEnd()}…`;
  }

  lines.push(last);

  return lines;
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  options: Options
) {
  const W = SHARE_WIDTH;
  const H = SHARE_HEIGHT;

  // Base oscura con los tonos de la web
  const bg = ctx.createLinearGradient(0, 0, 0, H);

  bg.addColorStop(0, "#0a0506");
  bg.addColorStop(0.5, "#09090b");
  bg.addColorStop(1, "#050506");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Muro de pósters, como en la web: inclinados y muy tenues
  options.backdrops?.forEach((img, index) => {
    const slot = BACKDROP_SLOTS[index];

    if (!slot || !img || img.width <= 0 || img.height <= 0) {
      return;
    }

    const [x, y, w, h, angle] = slot;

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((angle * Math.PI) / 180);

    roundedRect(ctx, -w / 2, -h / 2, w, h, 22);
    ctx.clip();

    const scale = Math.max(w / img.width, h / img.height);

    ctx.drawImage(
      img,
      (-img.width * scale) / 2,
      (-img.height * scale) / 2,
      img.width * scale,
      img.height * scale
    );

    ctx.restore();
  });

  // Resplandores rojo y azul de la web
  const red = ctx.createRadialGradient(120, 80, 0, 120, 80, 760);

  red.addColorStop(0, "rgba(220,38,38,0.38)");
  red.addColorStop(1, "rgba(220,38,38,0)");

  ctx.fillStyle = red;
  ctx.fillRect(0, 0, W, H);

  const blue = ctx.createRadialGradient(W - 100, 140, 0, W - 100, 140, 640);

  blue.addColorStop(0, "rgba(59,130,246,0.26)");
  blue.addColorStop(1, "rgba(59,130,246,0)");

  ctx.fillStyle = blue;
  ctx.fillRect(0, 0, W, H);

  // Viñeteado cinematográfico: oscurece el centro un poco y los bordes más
  const vignette = ctx.createRadialGradient(
    W / 2,
    H / 2,
    H * 0.2,
    W / 2,
    H / 2,
    H * 0.8
  );

  vignette.addColorStop(0, "rgba(0,0,0,0.38)");
  vignette.addColorStop(1, "rgba(0,0,0,0.78)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

export function drawShareImage(
  ctx: CanvasRenderingContext2D,
  items: ShareItem[],
  images: (DrawableImage | null)[],
  options: Options
) {
  const font =
    options.fontFamily ||
    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  const W = SHARE_WIDTH;
  const H = SHARE_HEIGHT;

  const spaced = ctx as CanvasRenderingContext2D & {
    letterSpacing?: string;
  };

  const previousSpacing = spaced.letterSpacing;

  const resetSpacing = () => {
    spaced.letterSpacing = previousSpacing ?? "0px";
  };

  drawBackdrop(ctx, options);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  // ---------- Logo (entero, con su nombre) ----------
  const logo = options.logo;

  if (logo && logo.width > 0 && logo.height > 0) {
    const logoH = 205;
    const logoW = (logo.width / logo.height) * logoH;
    const logoX = W / 2 - logoW / 2;
    const logoY = 70;

    // Brillo rojo detrás
    ctx.save();
    ctx.shadowColor = "rgba(239,68,68,0.55)";
    ctx.shadowBlur = 40;
    roundedRect(ctx, logoX, logoY, logoW, logoH, 30);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundedRect(ctx, logoX, logoY, logoW, logoH, 30);
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, logoW, logoH);
    ctx.restore();

    roundedRect(ctx, logoX, logoY, logoW, logoH, 30);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.font = `800 34px ${font}`;
    spaced.letterSpacing = "8px";
    ctx.fillText(options.siteName.toUpperCase(), W / 2 + 4, 170);
    resetSpacing();
  }

  // ---------- Título con el degradado de la web ----------
  const title = options.audience
    ? `Sugerencias para ${options.audience}`
    : "Mis sugerencias";

  // Los títulos largos (varios nombres) se encogen para caber
  let titleSize = 104;

  ctx.font = `800 ${titleSize}px ${font}`;

  while (
    titleSize > 48 &&
    ctx.measureText(title).width > W - 140
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
  ctx.fillText(title, W / 2, 400);
  ctx.restore();

  ctx.fillStyle = "#e4e4e7";
  ctx.font = `500 38px ${font}`;
  ctx.fillText(
    options.kind === "tv"
      ? "Series para ver hoy"
      : "Películas para ver hoy",
    W / 2,
    452
  );

  // ---------- Pósters ----------
  const shown = items.slice(0, 3);

  const totalW = shown.length * POSTER_W + (shown.length - 1) * GAP;

  const startX = (W - totalW) / 2;

  const POSTERS_TOP = 500;

  let mainsBefore = 0;

  shown.forEach((item, index) => {
    const x = startX + index * (POSTER_W + GAP);
    const y = POSTERS_TOP;

    const role = roleOf(item, mainsBefore);

    if (item.role !== "surprise") mainsBefore++;

    // Brillo del color de su etiqueta
    ctx.save();
    ctx.shadowColor = `${role.color}88`;
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 10;
    roundedRect(ctx, x, y, POSTER_W, POSTER_H, 24);
    ctx.fillStyle = "#18181b";
    ctx.fill();
    ctx.restore();

    // Póster (recortado a la forma, rellenando todo el hueco)
    ctx.save();
    roundedRect(ctx, x, y, POSTER_W, POSTER_H, 24);
    ctx.clip();

    const img = images[index];

    if (img && img.width > 0 && img.height > 0) {
      const scale = Math.max(
        POSTER_W / img.width,
        POSTER_H / img.height
      );

      const dw = img.width * scale;
      const dh = img.height * scale;

      ctx.drawImage(
        img,
        x + (POSTER_W - dw) / 2,
        y + (POSTER_H - dh) / 2,
        dw,
        dh
      );
    } else {
      const fallback = ctx.createLinearGradient(x, y, x, y + POSTER_H);

      fallback.addColorStop(0, "#27272a");
      fallback.addColorStop(1, "#18181b");

      ctx.fillStyle = fallback;
      ctx.fillRect(x, y, POSTER_W, POSTER_H);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = `600 28px ${font}`;
      ctx.fillText("Sin póster", x + POSTER_W / 2, y + POSTER_H / 2);
    }

    ctx.restore();

    // Borde del color de la etiqueta
    roundedRect(ctx, x + 1.5, y + 1.5, POSTER_W - 3, POSTER_H - 3, 24);
    ctx.strokeStyle = `${role.color}aa`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Insignia en la esquina: 1, 2 o ★ (sorpresa)
    const badgeX = x + 34;
    const badgeY = y + 34;

    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 27, 0, Math.PI * 2);
    ctx.fillStyle = role.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.stroke();

    ctx.fillStyle = "#111111";
    ctx.font = `800 30px ${font}`;
    ctx.fillText(
      item.role === "surprise" ? "★" : String(mainsBefore),
      badgeX,
      badgeY + 11
    );

    const cx = x + POSTER_W / 2;

    // Etiqueta (píldora)
    ctx.font = `800 22px ${font}`;
    spaced.letterSpacing = "3px";

    const labelW = ctx.measureText(role.label).width + 40;
    const pillY = y + POSTER_H + 26;

    roundedRect(ctx, cx - labelW / 2, pillY, labelW, 40, 20);
    ctx.fillStyle = `${role.color}26`;
    ctx.fill();
    ctx.strokeStyle = `${role.color}aa`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = role.color;
    ctx.fillText(role.label, cx + 1, pillY + 28);
    resetSpacing();

    // Título (máximo 2 líneas)
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 32px ${font}`;

    const lines = wrapLines(
      (text) => ctx.measureText(text).width,
      item.title,
      POSTER_W,
      2
    );

    lines.forEach((line, i) => {
      ctx.fillText(line, cx, pillY + 88 + i * 40);
    });

    // Nota y año
    const meta = [
      item.rating ? `★ ${String(item.rating).replace(".", ",")}` : "",
      item.year ? String(item.year) : "",
    ]
      .filter(Boolean)
      .join("  ·  ");

    if (meta) {
      ctx.fillStyle = "#d4d4d8";
      ctx.font = `500 26px ${font}`;
      ctx.fillText(meta, cx, pillY + 88 + lines.length * 40 + 8);
    }
  });

  // ---------- Pie ----------
  const url = options.siteUrl.replace(/^https?:\/\//, "");

  ctx.font = `800 40px ${font}`;

  const pillW = ctx.measureText(url).width + 90;
  const pillX = W / 2 - pillW / 2;
  const footY = H - 168;

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

// ------------------------------------------------------------
// Parte que sí necesita el navegador
// ------------------------------------------------------------

function loadImage(
  url: string | undefined,
  timeoutMs = 15000
): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);

  return new Promise((resolve) => {
    const img = new Image();

    const timer = window.setTimeout(() => resolve(null), timeoutMs);

    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };

    img.src = url;
  });
}

/** Crea la imagen y la devuelve lista para compartir o descargar. */
export async function createShareImage(
  items: ShareItem[],
  options: Options
): Promise<Blob> {
  // Pósters de las recomendaciones, logo y fondo (los de la propia web)
  const [images, logo, backdrops] = await Promise.all([
    Promise.all(
      items.slice(0, 3).map((item) => loadImage(item.posterUrl))
    ),
    loadImage("/Logo.png"),
    Promise.all(BACKDROP_FILES.map((file) => loadImage(file))),
  ]);

  // Esperamos a que la tipografía de la web esté lista
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

  drawShareImage(ctx, items, images, { ...options, logo, backdrops });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}
