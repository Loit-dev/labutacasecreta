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
  wrapLines,
  type DrawableImage,
} from "./shareImage";

export type CompatibilityShareTitle = {
  title: string;
  // Ya en nuestro dominio (lib/share.ts → posterSource), para poder
  // dibujarlo en el canvas sin problemas de CORS.
  posterUrl?: string;
};

export type CompatibilityShareGenre = {
  name: string;
};

export type CompatibilitySharePerson = {
  name: string;
  role: "director" | "actor";
};

export type CompatibilityShareOptions = {
  siteName: string;
  siteUrl: string;
  myUsername: string;
  theirUsername: string;
  percent: number;
  icon: string;
  label: string;
  commonRatedCount: number;
  // Las 3 pelis/series en las que más coincidís, mejor acuerdo
  // primero (se dibuja la primera al centro del abanico).
  topCommon: CompatibilityShareTitle[];
  topGenres: CompatibilityShareGenre[];
  sharedPerson?: CompatibilitySharePerson | null;
  fontFamily?: string;
  logo?: DrawableImage | null;
  backdrops?: (DrawableImage | null)[];
  // Cargados aparte (createCompatibilityShareImage), en el mismo
  // orden que topCommon.
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

  let cursorY = percentY + 110;

  // ---------- Pósters en abanico: las 3 en las que más coincidís,
  // la de más acuerdo al centro (mismo patrón que lib/summaryImage.ts,
  // en un tamaño más compacto para dejar sitio a géneros y pie) ----------
  const topCommon = options.topCommon.slice(0, 3);
  const posters = options.posters ?? [];

  if (topCommon.length > 0) {
    const mainW = 150;
    const mainH = 225;
    const sideW = 118;
    const sideH = 177;
    const sideOffsetX = 150;

    const mainCY = cursorY + 10 + mainH / 2;
    const sideCY = mainCY + 10;

    type FanSlot = {
      title: string;
      poster: DrawableImage | null;
      cx: number;
      cy: number;
      w: number;
      h: number;
      angle: number;
    };

    const positions = [
      { cx: W / 2, cy: mainCY, w: mainW, h: mainH, angle: 0 },
      { cx: W / 2 - sideOffsetX, cy: sideCY, w: sideW, h: sideH, angle: -10 },
      { cx: W / 2 + sideOffsetX, cy: sideCY, w: sideW, h: sideH, angle: 10 },
    ];

    const slots: FanSlot[] = topCommon.map((title, i) => ({
      title: title.title,
      poster: posters[i] ?? null,
      ...positions[i],
    }));

    // Las laterales primero, la central (índice 0) encima.
    const order = [...slots.keys()].sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : 0));

    order.forEach((i) => {
      const { title, poster, cx, cy, w, h, angle } = slots[i];
      const rad = (angle * Math.PI) / 180;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rad);

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = angle === 0 ? 40 : 24;
      ctx.shadowOffsetY = 8;
      roundedRect(ctx, -w / 2, -h / 2, w, h, 16);
      ctx.fillStyle = "#18181b";
      ctx.fill();
      ctx.restore();

      ctx.save();
      roundedRect(ctx, -w / 2, -h / 2, w, h, 16);
      ctx.clip();

      if (poster && poster.width > 0 && poster.height > 0) {
        const scale = Math.max(w / poster.width, h / poster.height);

        ctx.drawImage(
          poster,
          (-poster.width * scale) / 2,
          (-poster.height * scale) / 2,
          poster.width * scale,
          poster.height * scale
        );
      } else {
        const fallback = ctx.createLinearGradient(0, -h / 2, 0, h / 2);

        fallback.addColorStop(0, "#27272a");
        fallback.addColorStop(1, "#18181b");
        ctx.fillStyle = fallback;
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }

      ctx.restore();

      roundedRect(ctx, -w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 16);
      ctx.strokeStyle = "rgba(251,146,60,0.7)";
      ctx.lineWidth = angle === 0 ? 3 : 2;
      ctx.stroke();

      ctx.restore();

      // Título, horizontal (no gira), justo debajo del póster.
      const bottomX = cx - (h / 2) * Math.sin(rad);
      const bottomY = cy + (h / 2) * Math.cos(rad);

      ctx.textAlign = "center";
      ctx.fillStyle = "#e4e4e7";
      ctx.font = `700 ${angle === 0 ? 22 : 18}px ${font}`;

      const [line1 = ""] = wrapLines(
        (text) => ctx.measureText(text).width,
        title,
        w + 30,
        1
      );

      ctx.fillText(line1, bottomX, bottomY + 28);
    });

    cursorY = mainCY + mainH / 2 + 70;
  }

  // ---------- Géneros en los que más coincidís ----------
  const topGenres = options.topGenres.slice(0, 3);

  if (topGenres.length > 0) {
    ctx.font = `800 30px ${font}`;

    const gap = 20;
    const chipH = 56;
    const labels = topGenres.map((genre) => genre.name);
    const chipWidths = labels.map((label) => ctx.measureText(label).width + 48);
    const totalW =
      chipWidths.reduce((sum, w) => sum + w, 0) + gap * (labels.length - 1);

    let chipX = W / 2 - totalW / 2;
    const chipY = cursorY;

    labels.forEach((label, i) => {
      const chipW = chipWidths[i];

      roundedRect(ctx, chipX, chipY, chipW, chipH, chipH / 2);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
      ctx.strokeStyle = "rgba(251,146,60,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#e4e4e7";
      ctx.textAlign = "center";
      ctx.fillText(label, chipX + chipW / 2, chipY + chipH / 2 + 10);

      chipX += chipW + gap;
    });

    cursorY += chipH + 56;
  }

  // ---------- Dato extra: actor/actriz o director en común, o, si no
  // hay ninguno (lo normal con solo 3 títulos), el género que más se
  // repite — para que siempre haya un gancho, aunque sea genérico ----------
  const extraLine = options.sharedPerson
    ? `${
        options.sharedPerson.role === "director" ? "La mano de" : "Os convence"
      } ${options.sharedPerson.name}${
        options.sharedPerson.role === "actor" ? " en pantalla" : ""
      }`
    : topGenres[0]
      ? `Los dos sois fans de ${topGenres[0].name}`
      : null;

  if (extraLine) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `600 28px ${font}`;
    ctx.fillText(extraLine, W / 2, cursorY);
  }

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
  const [logo, backdrops, posters] = await Promise.all([
    loadImage("/Logo.png"),
    Promise.all(BACKDROP_FILES.map((file) => loadImage(file))),
    Promise.all(options.topCommon.slice(0, 3).map((t) => loadImage(t.posterUrl))),
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

  drawCompatibilityShareImage(ctx, { ...options, logo, backdrops, posters });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}
