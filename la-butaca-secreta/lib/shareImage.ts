/**
 * Dibuja la imagen «Mis sugerencias» (3 pósters) en un canvas.
 *
 * Formato vertical 9:16 (1080×1920) para Stories y Reels de Instagram,
 * estados de WhatsApp, TikTok… Todo lo importante queda en la zona
 * segura (sin los ~250 px de arriba ni los ~340 px de abajo, que tapa
 * la interfaz de esas apps). Esta función no depende de React ni de
 * Next, así que se puede probar en un navegador de pruebas.
 */

import type { ShareItem, ShareKind } from "./share";

export const SHARE_WIDTH = 1080;
export const SHARE_HEIGHT = 1920;

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
  // Cuánto han coincidido (0-100); solo con «audience»
  compatibility?: number;
  // Logo de la web y pósters de fondo (los mismos que usa la web)
  logo?: DrawableImage | null;
  backdrops?: (DrawableImage | null)[];
};

// Pósters decorativos del fondo: (x, y, ancho, alto, giro en grados)
const BACKDROP_SLOTS: [number, number, number, number, number][] = [
  [-70, 20, 380, 600, -10],
  [-60, 660, 380, 600, 6],
  [-80, 1300, 380, 620, -6],
  [770, 0, 380, 600, 10],
  [780, 640, 380, 600, -6],
  [760, 1290, 380, 620, 8],
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
    const logoH = 180;
    const logoW = (logo.width / logo.height) * logoH;
    const logoX = W / 2 - logoW / 2;
    const logoY = 235;

    // Resplandor rojo por debajo del logo (no detrás, para no empastarlo),
    // sin marco: el fondo negro del logo se funde con la imagen («screen»)
    const glowY = logoY + logoH + 6;

    const glow = ctx.createRadialGradient(W / 2, glowY, 0, W / 2, glowY, 300);

    glow.addColorStop(0, "rgba(239,68,68,0.34)");
    glow.addColorStop(1, "rgba(239,68,68,0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, glowY - 300, W, 600);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(logo, logoX, logoY, logoW, logoH);
    ctx.restore();
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.font = `800 34px ${font}`;
    spaced.letterSpacing = "8px";
    ctx.fillText(options.siteName.toUpperCase(), W / 2 + 4, 380);
    resetSpacing();
  }

  // ---------- Título con el degradado de la web ----------
  const title = options.audience
    ? `Sugerencias para ${options.audience}`
    : "Mis sugerencias";

  // Los títulos largos (varios nombres) se encogen para caber
  let titleSize = 96;

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
  ctx.fillText(title, W / 2, 505);
  ctx.restore();

  ctx.fillStyle = "#e4e4e7";
  ctx.font = `500 38px ${font}`;
  const what =
    options.kind === "tv"
      ? "Series para ver hoy"
      : "Películas para ver hoy";

  ctx.fillText(
    options.audience && options.compatibility !== undefined
      ? `${what} · ${options.compatibility} % de coincidencia`
      : what,
    W / 2,
    562
  );

  // ---------- Pósters: abanico con la apuesta principal al centro ----------
  const shown = items.slice(0, 3);

  // Posición en el abanico: [centro x, centro y, ancho, alto, giro]
  const FAN: [number, number, number, number, number][] = [
    [W / 2, 895, 390, 585, 0],
    [218, 925, 300, 450, -7],
    [W - 218, 925, 300, 450, 7],
  ];

  // Foco de luz detrás de los pósters
  const spot = ctx.createRadialGradient(W / 2, 895, 0, W / 2, 895, 620);

  spot.addColorStop(0, "rgba(251,146,60,0.28)");
  spot.addColorStop(1, "rgba(251,146,60,0)");

  ctx.fillStyle = spot;
  ctx.fillRect(0, 270, W, 1260);

  // Se dibujan primero los laterales y al final el principal (encima)
  const order = shown.map((_, i) => i).sort((x, y) => y - x);

  const roles: (typeof ROLES)[keyof typeof ROLES][] = [];

  {
    let mains = 0;

    shown.forEach((item) => {
      roles.push(roleOf(item, mains));
      if (item.role !== "surprise") mains++;
    });
  }

  order.forEach((index) => {
    const [cx, cy, w, h, angle] = FAN[index];
    const role = roles[index];
    const item = shown[index];

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angle * Math.PI) / 180);

    // Brillo del color de su etiqueta
    ctx.save();
    ctx.shadowColor = `${role.color}99`;
    ctx.shadowBlur = index === 0 ? 70 : 44;
    ctx.shadowOffsetY = 14;
    roundedRect(ctx, -w / 2, -h / 2, w, h, 26);
    ctx.fillStyle = "#18181b";
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundedRect(ctx, -w / 2, -h / 2, w, h, 26);
    ctx.clip();

    const img = images[index];

    if (img && img.width > 0 && img.height > 0) {
      const scale = Math.max(w / img.width, h / img.height);

      ctx.drawImage(
        img,
        (-img.width * scale) / 2,
        (-img.height * scale) / 2,
        img.width * scale,
        img.height * scale
      );
    } else {
      const fallback = ctx.createLinearGradient(0, -h / 2, 0, h / 2);

      fallback.addColorStop(0, "#27272a");
      fallback.addColorStop(1, "#18181b");

      ctx.fillStyle = fallback;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = `600 28px ${font}`;
      ctx.fillText("Sin póster", 0, 10);
    }

    ctx.restore();

    roundedRect(ctx, -w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 26);
    ctx.strokeStyle = `${role.color}cc`;
    ctx.lineWidth = index === 0 ? 5 : 3;
    ctx.stroke();

    // Insignia en la esquina: 1, 2 o ★ (sorpresa)
    const bx = -w / 2 + 38;
    const by = -h / 2 + 38;

    ctx.beginPath();
    ctx.arc(bx, by, 29, 0, Math.PI * 2);
    ctx.fillStyle = role.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.stroke();

    ctx.fillStyle = "#111111";
    ctx.font = `800 32px ${font}`;
    ctx.fillText(
      item.role === "surprise"
        ? "★"
        : String(roles.slice(0, index + 1).filter((_, i) => shown[i].role !== "surprise").length),
      bx,
      by + 11
    );

    ctx.restore();
  });

  // ---------- Lista: una fila por título ----------
  const ROW_TOP = 1236;
  const ROW_H = 90;

  shown.forEach((item, index) => {
    const role = roles[index];
    const y = ROW_TOP + index * ROW_H;
    const x = 90;
    const rowW = W - 180;

    roundedRect(ctx, x, y, rowW, ROW_H - 12, 24);
    ctx.fillStyle = "rgba(24,24,27,0.72)";
    ctx.fill();
    ctx.strokeStyle = `${role.color}55`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Etiqueta de color
    ctx.textAlign = "left";
    ctx.font = `800 20px ${font}`;
    spaced.letterSpacing = "2px";

    const labelW = ctx.measureText(role.label).width + 32;

    roundedRect(ctx, x + 22, y + 19, labelW, 40, 20);
    ctx.fillStyle = `${role.color}26`;
    ctx.fill();
    ctx.strokeStyle = `${role.color}aa`;
    ctx.stroke();

    ctx.fillStyle = role.color;
    ctx.fillText(role.label, x + 38, y + 46);
    resetSpacing();

    // Título (una línea) y nota/año a la derecha
    const meta = [
      item.rating ? `★ ${String(item.rating).replace(".", ",")}` : "",
      item.year ? String(item.year) : "",
    ]
      .filter(Boolean)
      .join(" · ");

    ctx.textAlign = "right";
    ctx.fillStyle = "#d4d4d8";
    ctx.font = `600 26px ${font}`;
    ctx.fillText(meta, x + rowW - 24, y + 48);

    const metaW = meta ? ctx.measureText(meta).width + 24 : 0;
    const titleX = x + 22 + labelW + 20;
    const titleMax = x + rowW - 24 - metaW - titleX;

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 32px ${font}`;

    const [line = ""] = wrapLines(
      (text) => ctx.measureText(text).width,
      item.title,
      titleMax,
      1
    );

    ctx.fillText(line, titleX, y + 48);
  });

  ctx.textAlign = "center";

  // ---------- Pie ----------
  const url = options.siteUrl.replace(/^https?:\/\//, "");

  ctx.font = `800 40px ${font}`;

  const pillW = ctx.measureText(url).width + 90;
  const pillX = W / 2 - pillW / 2;
  const footY = 1520;

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
