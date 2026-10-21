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
};

const POSTER_W = 300;
const POSTER_H = 450;
const GAP = 30;
const POSTERS_Y = 445;

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

  // ---------- Fondo ----------
  const bg = ctx.createLinearGradient(0, 0, W, H);

  bg.addColorStop(0, "#1c0707");
  bg.addColorStop(0.55, "#09090b");
  bg.addColorStop(1, "#0b1220");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(150, 100, 0, 150, 100, 700);

  glow.addColorStop(0, "rgba(220,38,38,0.28)");
  glow.addColorStop(1, "rgba(220,38,38,0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  // ---------- Cabecera ----------
  ctx.fillStyle = "#ef4444";
  ctx.font = `800 34px ${font}`;

  // Letras separadas (si el navegador lo admite)
  const spaced = ctx as CanvasRenderingContext2D & {
    letterSpacing?: string;
  };

  const previousSpacing = spaced.letterSpacing;

  spaced.letterSpacing = "8px";
  ctx.fillText(options.siteName.toUpperCase(), W / 2 + 4, 120);
  spaced.letterSpacing = previousSpacing ?? "0px";

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 104px ${font}`;
  ctx.fillText("Mis sugerencias", W / 2, 250);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = `500 38px ${font}`;
  ctx.fillText(
    options.kind === "tv"
      ? "Series para ver hoy"
      : "Películas para ver hoy",
    W / 2,
    325
  );

  // ---------- Pósters ----------
  const shown = items.slice(0, 3);

  const totalW = shown.length * POSTER_W + (shown.length - 1) * GAP;

  const startX = (W - totalW) / 2;

  let mainsBefore = 0;

  shown.forEach((item, index) => {
    const x = startX + index * (POSTER_W + GAP);
    const y = POSTERS_Y;

    // Sombra
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
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

    // Borde fino
    roundedRect(ctx, x + 1, y + 1, POSTER_W - 2, POSTER_H - 2, 24);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Etiqueta
    const role = roleOf(item, mainsBefore);

    if (item.role !== "surprise") mainsBefore++;

    const cx = x + POSTER_W / 2;

    ctx.fillStyle = role.color;
    ctx.font = `800 24px ${font}`;
    spaced.letterSpacing = "3px";
    ctx.fillText(role.label, cx + 1, y + POSTER_H + 56);
    spaced.letterSpacing = previousSpacing ?? "0px";

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
      ctx.fillText(line, cx, y + POSTER_H + 100 + i * 40);
    });

    // Nota y año
    const meta = [
      item.rating ? `★ ${String(item.rating).replace(".", ",")}` : "",
      item.year ? String(item.year) : "",
    ]
      .filter(Boolean)
      .join("  ·  ");

    if (meta) {
      ctx.fillStyle = "#a1a1aa";
      ctx.font = `500 26px ${font}`;
      ctx.fillText(meta, cx, y + POSTER_H + 100 + lines.length * 40 + 12);
    }
  });

  // ---------- Pie ----------
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, 1205);
  ctx.lineTo(W / 2 + 200, 1205);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 44px ${font}`;
  ctx.fillText(options.siteUrl.replace(/^https?:\/\//, ""), W / 2, 1268);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = `500 28px ${font}`;
  ctx.fillText(
    "¿No sabes qué ver? Te recomiendo solo tres.",
    W / 2,
    1315
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
  const images = await Promise.all(
    items.slice(0, 3).map((item) => loadImage(item.posterUrl))
  );

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

  drawShareImage(ctx, items, images, options);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}
