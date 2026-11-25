"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/hooks/useAuth";
import { useDialog } from "@/hooks/useDialog";
import { useWrapped } from "@/hooks/useWrapped";
import { useWrappedCastHighlights } from "@/hooks/useWrappedCastHighlights";
import { useWrappedFriendsGroup } from "@/hooks/useWrappedFriendsGroup";
import { useWrappedTrendy } from "@/hooks/useWrappedTrendy";
import { track } from "@/lib/analytics";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { recordShareEvent } from "@/lib/supabase/achievements";
import { fetchMyProfile } from "@/lib/supabase/profiles";
import type { WatchedRow } from "@/lib/supabase/summary";
import type { WrappedStats } from "@/lib/wrapped";
import { createWrappedShareImage } from "@/lib/wrappedShareImage";
import {
  DiscardIcon,
  FireIcon,
  GemIcon,
  PersonIcon,
  PinIcon,
  ShareIcon,
} from "@/components/icons/Icons";

type Props = {
  year: number;
  onClose: () => void;
};

type Slide = { id: string; node: React.ReactNode };

const CARD =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm";

// Fondo base del Resumen, detrás de todas las pantallas: el mismo
// degradado oscuro difuso de toda la web (app/globals.css, body — rojo
// arriba-izquierda, azul arriba-derecha, mantenido tal cual). Encima de
// esta base, cada tarjeta añade su propio "papel de regalo" (ver
// GIFT_WRAPS / GiftWrapLayer más abajo), distinto en cada pantalla.
const SITE_BACKGROUND =
  "radial-gradient(circle at top left, rgba(220,38,38,0.18), transparent 30%), radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 30%), linear-gradient(180deg, #050505 0%, #09090b 40%, #050505 100%)";

/**
 * Un "papel de regalo" por pantalla: su propio papel (color + motivo
 * navideño estampado, como el papel de verdad) y su propio lazo de
 * cinta de raso (color y esquina) — como en un regalo real envuelto,
 * no un degradado abstracto. Cada pantalla usa un papel y un lazo
 * distintos.
 */
type Motif = "snowflake" | "tree" | "star" | "holly";

type RibbonScheme = {
  /** Color base del raso, su sombra y su brillo (para el degradado del lazo). */
  color: string;
  shadow: string;
  highlight: string;
  /** Color de fondo del papel (tono oscuro, para seguir leyéndose como la web). */
  paperBase: string;
  /** Motivo navideño estampado en el papel, y su color. */
  motif: Motif;
  motifColor: string;
  /** Resplandores suaves sobre el papel, mismo estilo que el fondo de la web. */
  glowA: string;
  glowB: string;
  /** Esquina donde se cruza el lazo. */
  corner: "tl" | "tr" | "bl" | "br";
};

const GIFT_WRAPS: Record<string, RibbonScheme> = {
  portada: {
    color: "#dc2626",
    shadow: "#7f1d1d",
    highlight: "#fca5a5",
    paperBase: "#3f0a0a",
    motif: "snowflake",
    motifColor: "#fbbf24",
    glowA: "rgba(220,38,38,0.22)",
    glowB: "rgba(251,191,36,0.14)",
    corner: "tl",
  },
  total: {
    color: "#d97706",
    shadow: "#78350f",
    highlight: "#fde68a",
    paperBase: "#3a2410",
    motif: "tree",
    motifColor: "#fde68a",
    glowA: "rgba(251,191,36,0.22)",
    glowB: "rgba(220,38,38,0.14)",
    corner: "tr",
  },
  genero: {
    color: "#15803d",
    shadow: "#052e16",
    highlight: "#86efac",
    paperBase: "#06281a",
    motif: "tree",
    motifColor: "#fbbf24",
    glowA: "rgba(21,128,61,0.24)",
    glowB: "rgba(59,130,246,0.14)",
    corner: "bl",
  },
  cara: {
    color: "#9d174d",
    shadow: "#500724",
    highlight: "#f9a8d4",
    paperBase: "#3b0d28",
    motif: "holly",
    motifColor: "#f9a8d4",
    glowA: "rgba(157,23,77,0.24)",
    glowB: "rgba(251,191,36,0.12)",
    corner: "br",
  },
  trendy: {
    color: "#ea580c",
    shadow: "#7c2d12",
    highlight: "#fdba74",
    paperBase: "#3a2410",
    motif: "star",
    motifColor: "#fdba74",
    glowA: "rgba(234,88,12,0.24)",
    glowB: "rgba(21,128,61,0.12)",
    corner: "tl",
  },
  amigos: {
    color: "#0f766e",
    shadow: "#042f2e",
    highlight: "#5eead4",
    paperBase: "#0a1f33",
    motif: "snowflake",
    motifColor: "#e2e8f0",
    glowA: "rgba(15,118,110,0.24)",
    glowB: "rgba(251,191,36,0.12)",
    corner: "tr",
  },
  progreso: {
    color: "#d97706",
    shadow: "#78350f",
    highlight: "#fde68a",
    paperBase: "#38240c",
    motif: "star",
    motifColor: "#fde68a",
    glowA: "rgba(251,191,36,0.22)",
    glowB: "rgba(234,88,12,0.14)",
    corner: "bl",
  },
  final: {
    color: "#dc2626",
    shadow: "#7f1d1d",
    highlight: "#fca5a5",
    paperBase: "#3f0a0a",
    motif: "holly",
    motifColor: "#fde68a",
    glowA: "rgba(220,38,38,0.22)",
    glowB: "rgba(251,191,36,0.16)",
    corner: "br",
  },
};

const MOTIF_TILE = 72;

/** Estampado navideño tileable para el papel: copo de nieve, abeto, estrella u hoja de acebo con sus bayas — siempre nítido, como un papel de regalo impreso de verdad. */
function motifPattern(motif: Motif, color: string): string {
  const t = MOTIF_TILE;
  const half = t / 2;

  let inner = "";
  if (motif === "snowflake") {
    inner = `<g stroke="${color}" stroke-opacity="0.55" stroke-width="2.2" stroke-linecap="round" fill="none">
      <path d="M${half} 10 L${half} 62 M${half - 16} 16 L${half + 16} 56 M${half + 16} 16 L${half - 16} 56"/>
      <path d="M${half} 18 L${half - 6} 24 M${half} 18 L${half + 6} 24 M${half} 54 L${half - 6} 48 M${half} 54 L${half + 6} 48"/>
    </g>`;
  } else if (motif === "tree") {
    inner = `<g fill="${color}" fill-opacity="0.5">
      <path d="M${half} 8 L${half + 10} 24 L${half + 4} 24 L${half + 14} 38 L${half + 7} 38 L${half + 18} 54 L${half - 18} 54 L${half - 7} 38 L${half - 14} 38 L${half - 4} 24 L${half - 10} 24 Z"/>
      <rect x="${half - 3}" y="54" width="6" height="8"/>
    </g>`;
  } else if (motif === "star") {
    inner = `<g fill="${color}" fill-opacity="0.5">
      <path d="M${half} 14 C${half + 1} 26 ${half + 2} 27 ${half + 14} 28 C${half + 2} 29 ${half + 1} 30 ${half} 42 C${half - 1} 30 ${half - 2} 29 ${half - 14} 28 C${half - 2} 27 ${half - 1} 26 ${half} 14 Z"/>
      <circle cx="${half - 22}" cy="${half + 14}" r="2.4"/>
      <circle cx="${half + 22}" cy="${half + 16}" r="2"/>
    </g>`;
  } else {
    inner = `<g fill="${color}" fill-opacity="0.5">
      <path d="M${half - 6} 34 C${half - 14} 30 ${half - 16} 20 ${half - 8} 16 C${half - 6} 22 ${half - 2} 24 ${half + 2} 22 C${half - 2} 28 ${half - 2} 32 ${half - 6} 34 Z"/>
      <path d="M${half + 6} 34 C${half + 14} 30 ${half + 16} 20 ${half + 8} 16 C${half + 6} 22 ${half + 2} 24 ${half - 2} 22 C${half + 2} 28 ${half + 2} 32 ${half + 6} 34 Z"/>
      <circle cx="${half - 3}" cy="40" r="3" fill="#dc2626" fill-opacity="0.75"/>
      <circle cx="${half + 3}" cy="42" r="3" fill="#dc2626" fill-opacity="0.75"/>
    </g>`;
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${t}' height='${t}'>${inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * El "papel" de cada pantalla: su color propio con el estampado
 * navideño encima (tamaño completo, no en miniatura) y, por debajo,
 * los mismos resplandores difusos que el fondo de la web para que
 * no quede un color plano.
 */
function paperBackground(scheme: RibbonScheme): string {
  const pattern = motifPattern(scheme.motif, scheme.motifColor);

  return `${pattern} 0 0/${MOTIF_TILE}px ${MOTIF_TILE}px repeat, radial-gradient(circle at top left, ${scheme.glowA}, transparent 60%), radial-gradient(circle at top right, ${scheme.glowB}, transparent 60%), linear-gradient(180deg, ${scheme.paperBase} 0%, #050505 60%, #050505 100%)`;
}

/**
 * Lazo de cinta en una esquina: dos bandas de raso (con sombra, cuerpo
 * y brillo especular, para que se note redondeado) que se cruzan bajo
 * un lazo. Todo el grupo lleva un desenfoque ligero + una sombra suave
 * debajo, para que se integre en el fondo difuminado en vez de verse
 * como una pegatina recortada.
 */
function RibbonCorner({ scheme }: { scheme: RibbonScheme }) {
  const vb = { w: 300, h: 620 };
  const band = 46;
  const flipX = scheme.corner === "tr" || scheme.corner === "br";
  const flipY = scheme.corner === "bl" || scheme.corner === "br";
  const vX = flipX ? vb.w - 58 : 58;
  const hY = flipY ? vb.h - 58 : 58;
  const uid = `${scheme.corner}-${scheme.color.replace("#", "")}`;

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${vb.w} ${vb.h}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.94]"
      style={{ filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.5))" }}
    >
      <defs>
        <linearGradient id={`rv-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={scheme.shadow} />
          <stop offset="28%" stopColor={scheme.color} />
          <stop offset="46%" stopColor={scheme.highlight} />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="54%" stopColor={scheme.highlight} />
          <stop offset="72%" stopColor={scheme.color} />
          <stop offset="100%" stopColor={scheme.shadow} />
        </linearGradient>
        <linearGradient id={`rh-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={scheme.shadow} />
          <stop offset="28%" stopColor={scheme.color} />
          <stop offset="46%" stopColor={scheme.highlight} />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="54%" stopColor={scheme.highlight} />
          <stop offset="72%" stopColor={scheme.color} />
          <stop offset="100%" stopColor={scheme.shadow} />
        </linearGradient>
        <linearGradient id={`loop-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="30%" stopColor={scheme.highlight} />
          <stop offset="65%" stopColor={scheme.color} />
          <stop offset="100%" stopColor={scheme.shadow} />
        </linearGradient>
      </defs>

      <rect x={vX - band / 2} y="0" width={band} height={vb.h} fill={`url(#rv-${uid})`} />
      <rect x="0" y={hY - band / 2} width={vb.w} height={band} fill={`url(#rh-${uid})`} />

      <g transform={`translate(${vX}, ${hY})`}>
        {/* cola del lazo, por detrás de los dos lazos */}
        <path d="M -7 11 L -12 40 L 0 30 L 12 40 L 7 11 Z" fill={scheme.shadow} />
        <path d="M -7 11 L -10 32 L 0 26 L 0 11 Z" fill={scheme.color} opacity={0.6} />
        {/* los dos lazos del nudo */}
        <path
          d="M 0 -8 C -20 -28 -52 -24 -52 -2 C -52 18 -24 22 0 8 Z"
          fill={`url(#loop-${uid})`}
          stroke={scheme.shadow}
          strokeWidth="2"
        />
        <path
          d="M 0 -8 C 20 -28 52 -24 52 -2 C 52 18 24 22 0 8 Z"
          fill={`url(#loop-${uid})`}
          stroke={scheme.shadow}
          strokeWidth="2"
        />
        {/* nudo central */}
        <circle r="12" fill={scheme.color} stroke={scheme.shadow} strokeWidth="2" />
        <circle cx="-3" cy="-3" r="4.5" fill="#fff" opacity={0.75} />
      </g>
    </svg>
  );
}

/** Genera posiciones pseudoaleatorias (pero estables) a partir de un texto, para que cada pantalla reparta sus copos de forma distinta sin tener que escribirlas a mano una a una. */
function seededDots(
  seed: string,
  count: number
): Array<{ top: number; left: number; size: number }> {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;

  function next(): number {
    s = (s * 1103515245 + 12345) >>> 0;
    return (s >>> 8) / 16777216;
  }

  return Array.from({ length: count }).map(() => ({
    top: 6 + next() * 82,
    left: 6 + next() * 82,
    size: 10 + next() * 16,
  }));
}

/** Copos/estrellas navideñas difuminadas (como el resto de la web: resplandores suaves, no iconos nítidos), repartidas de forma distinta en cada pantalla. */
function FestiveBokeh({ seed, scheme }: { seed: string; scheme: RibbonScheme }) {
  const dots = seededDots(seed, 7);
  const colors = ["#ffffff", scheme.highlight, "#ffffff"];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            borderRadius: "9999px",
            background: colors[i % colors.length],
            filter: "blur(5px)",
            opacity: i % 3 === 0 ? 0.5 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

function GiftWrapLayer({ wrap, slideId }: { wrap: RibbonScheme; slideId: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: paperBackground(wrap) }}
    >
      <FestiveBokeh seed={slideId} scheme={wrap} />
      <RibbonCorner scheme={wrap} />
    </div>
  );
}

/** Números/titulares grandes: Bebas Neue pero con el tracking apretado del mockup (marquee-font de la app lo abre 0.04em para rótulos cortos; aquí buscamos el golpe visual de una cifra enorme). */
const DISPLAY_TRACKING = { letterSpacing: "0.01em" } as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
      {children}
    </p>
  );
}

function shareText(stats: WrappedStats): string {
  const lines = [
    `Mi ${stats.year} en ${SITE_NAME}:`,
    `🎬 ${stats.totalWatched} títulos vistos (${stats.movieCount} pelis, ${stats.seriesCount} series)`,
  ];

  if (stats.topGenres[0]) {
    lines.push(`🏆 Género del año: ${stats.topGenres[0].name}`);
  }

  if (stats.longestStreak > 1) {
    lines.push(`🔥 Racha máxima: ${stats.longestStreak} días seguidos`);
  }

  lines.push(`👉 ${SITE_URL}`);

  return lines.join("\n");
}

function buildSlides(stats: WrappedStats): Slide[] {
  const slides: Slide[] = [];

  slides.push({
    id: "portada",
    node: (
      <div className="flex h-full flex-col items-start justify-center gap-5">
        <Eyebrow>Resumen {stats.year}</Eyebrow>
        <h1
          className="marquee-font text-[64px] leading-[0.9] text-white"
          style={DISPLAY_TRACKING}
        >
          Tu año
          <br />
          en butaca.
        </h1>
        <p className="max-w-[28ch] text-base leading-relaxed text-zinc-300">
          Esto es lo que ha dado de sí tu {stats.year} en {SITE_NAME}.
        </p>
        <div className="flex w-full gap-3">
          <div className={`${CARD} !p-3 flex-1 text-center`}>
            <p
              className="marquee-font text-3xl text-amber-300"
              style={DISPLAY_TRACKING}
            >
              {stats.totalWatched}
            </p>
            <p className="text-[11px] text-zinc-400">títulos</p>
          </div>
          <div className={`${CARD} !p-3 flex-1 text-center`}>
            <p
              className="marquee-font truncate text-3xl text-amber-300"
              style={DISPLAY_TRACKING}
            >
              {stats.topGenres[0]?.name ?? "—"}
            </p>
            <p className="text-[11px] text-zinc-400">tu género</p>
          </div>
          <div className={`${CARD} !p-3 flex-1 text-center`}>
            <p
              className="marquee-font text-3xl text-amber-300"
              style={DISPLAY_TRACKING}
            >
              {stats.longestStreak || "—"}
            </p>
            <p className="text-[11px] text-zinc-400">racha</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500">Toca los lados para avanzar →</p>
      </div>
    ),
  });

  const hasPendingOrRejected =
    stats.oldestPendingTitle || stats.rejectedThisYearCount > 0;
  const hasStreakInfo = stats.longestStreak > 1 || stats.peakMonth;

  slides.push({
    id: "total",
    node: (
      <div className="flex h-full flex-col justify-center gap-3">
        <Eyebrow>Tu año en cifras</Eyebrow>
        <div>
          <span
            className="marquee-font text-[90px] leading-[0.82] text-white"
            style={DISPLAY_TRACKING}
          >
            {stats.totalWatched}
          </span>
          <span className="ml-1 text-lg font-extrabold text-zinc-300">
            títulos
          </span>
        </div>
        <p className="text-sm text-zinc-300">
          {stats.movieCount} pelis · {stats.seriesCount} series · ~
          {stats.approxHours}h de pantalla (aprox)
        </p>

        {(hasStreakInfo || stats.monthlyCounts.some((m) => m.count > 0)) && (
          <div className={`${CARD} !p-4`}>
            {stats.longestStreak > 1 && (
              <div className="flex items-end gap-2">
                <span className="marquee-font text-4xl leading-none text-white">
                  {stats.longestStreak}
                </span>
                <span className="flex items-center gap-1 pb-0.5 text-xs font-extrabold text-zinc-300">
                  <FireIcon size={14} className="text-orange-400" />
                  días seguidos, tu racha más larga
                </span>
              </div>
            )}
            {stats.peakMonth && (
              <p className="mt-1 text-xs text-zinc-400">
                {stats.peakMonth.label} fue tu mes fuerte, con{" "}
                {stats.peakMonth.count}{" "}
                {stats.peakMonth.count === 1 ? "título" : "títulos"}.
              </p>
            )}
            {stats.monthlyCounts.some((m) => m.count > 0) && (
              <>
                <div className="mt-2 flex h-12 items-end gap-1">
                  {stats.monthlyCounts.map((m) => {
                    const max = Math.max(
                      1,
                      ...stats.monthlyCounts.map((x) => x.count)
                    );
                    const isPeak =
                      stats.peakMonth?.monthIndex === m.monthIndex;

                    return (
                      <div
                        key={m.monthIndex}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                      >
                        <div
                          className={`w-full rounded-t ${
                            isPeak
                              ? "bg-gradient-to-t from-red-600 to-amber-400"
                              : "bg-white/15"
                          }`}
                          style={{
                            height: `${Math.max(6, (m.count / max) * 100)}%`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex gap-1">
                  {stats.monthlyCounts.map((m) => (
                    <span
                      key={m.monthIndex}
                      className={`flex-1 text-center text-[9px] ${
                        stats.peakMonth?.monthIndex === m.monthIndex
                          ? "font-bold text-amber-300"
                          : "text-zinc-500"
                      }`}
                    >
                      {m.label.charAt(0).toUpperCase()}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {hasPendingOrRejected && (
          <div className="flex flex-col gap-1.5">
            {stats.oldestPendingTitle && (
              <div className={`${CARD} !p-3 flex items-center gap-3 border-amber-400/25 bg-amber-400/5`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                  <PinIcon size={14} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {stats.oldestPendingTitle}
                  </p>
                  <p className="text-xs text-zinc-400">
                    lleva {stats.oldestPendingMonths ?? 0} meses esperando
                    en Pendientes
                  </p>
                </div>
              </div>
            )}

            {stats.rejectedThisYearCount > 0 && (
              <div className={`${CARD} !p-3 flex items-center gap-3`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300">
                  <DiscardIcon size={14} />
                </span>
                <p className="text-sm text-zinc-300">
                  <span className="font-extrabold text-white">
                    {stats.rejectedThisYearCount}
                  </span>{" "}
                  descartados este año con &ldquo;No me apetece&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    ),
  });

  if (stats.topGenres.length > 0 || stats.peakDay || stats.lastOfYear) {
    const [first, ...rest] = stats.topGenres;

    slides.push({
      id: "genero",
      node: (
        <div className="flex h-full flex-col justify-center gap-3">
          <Eyebrow>Tu género y tus momentos</Eyebrow>

          {first && (
            <>
              <h2
                className="marquee-font text-[42px] leading-[0.92] text-white"
                style={DISPLAY_TRACKING}
              >
                {first.name}, sin duda.
              </h2>
              <div className="flex flex-col gap-1.5">
                {[first, ...rest.slice(0, 2)].map((g, i) => (
                  <div
                    key={g.name}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-1.5 ${
                      i === 0
                        ? "border-amber-400/40 bg-amber-400/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <span className="marquee-font w-5 text-base text-zinc-400">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-bold text-white">
                      {g.name}
                    </span>
                    <span className="text-sm text-zinc-400">{g.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {stats.peakDay && (
            <div className={`${CARD} !p-3`}>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                🍿 Tu pico del año
              </p>
              <p className="marquee-font mt-0.5 text-2xl text-white">
                {new Date(stats.peakDay.date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p className="mt-0.5 text-xs text-zinc-300">
                {stats.peakDay.count} títulos en una sola sesión — maratón
                en toda regla.
              </p>
            </div>
          )}

          {stats.lastOfYear && (
            <div className={`${CARD} !p-3 border-amber-400/20 bg-amber-400/5`}>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
                Así cerraste el año
              </p>
              <p className="marquee-font mt-0.5 text-xl text-white">
                {stats.lastOfYear.title}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {new Date(stats.lastOfYear.seenAt).toLocaleDateString(
                  "es-ES",
                  { day: "numeric", month: "long" }
                )}
                {stats.lastOfYear.rating &&
                  ` · ${"★".repeat(Math.round(stats.lastOfYear.rating))}`}
              </p>
            </div>
          )}
        </div>
      ),
    });
  }

  if (stats.canonTotalProgress > 0 || stats.achievementsThisYear.length > 0) {
    slides.push({
      id: "progreso",
      node: (
        <div className="flex h-full flex-col justify-center gap-4">
          <Eyebrow>Tu progreso</Eyebrow>

          {stats.canonTotalProgress > 0 && (
            <div className={`${CARD} flex items-center gap-4`}>
              <div className="flex-1">
                <p className="text-xs text-zinc-400">El Canon</p>
                <p className="marquee-font text-3xl text-white">
                  {stats.canonTotalProgress} / {stats.canonTotal}
                </p>
                <p className="text-xs font-bold text-amber-300">
                  +{stats.canonThisYear} películas este año
                </p>
              </div>
            </div>
          )}

          {stats.achievementsThisYear.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-zinc-300">
                <span className="marquee-font text-xl text-white">
                  {stats.achievementsThisYear.length}
                </span>{" "}
                insignias nuevas este año:
              </p>
              {stats.achievementsThisYear.map((a) => (
                <div
                  key={`${a.key}-${a.level}`}
                  className={`${CARD} flex items-center gap-3 !p-3`}
                >
                  <div>
                    <p className="text-sm font-extrabold text-white">
                      {a.familyName}
                    </p>
                    <p className="text-xs text-amber-300">
                      {a.tierName} · nivel {a.level} de 5
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-200">
            ⭐ En total llevas {stats.achievementsTotalUnlocked} niveles
            desbloqueados desde que usas {SITE_NAME}.
          </p>
        </div>
      ),
    });
  }

  return slides;
}

type ShareSession = { user: { id: string } } | null;

/** Pósters del año (los que tienen portada), para la imagen de compartir. */
function yearPosterUrls(watched: WatchedRow[], year: number, limit = 12): string[] {
  return watched
    .filter((row) => new Date(row.seenAt).getFullYear() === year && row.posterUrl)
    .slice(0, limit)
    .map((row) => row.posterUrl as string);
}

/**
 * Comparte el Resumen como imagen (no solo texto) desde cualquier
 * pantalla, no solo la tarjeta final: genera la misma imagen de
 * cierre (lib/wrappedShareImage.ts) y la comparte como archivo si el
 * dispositivo lo permite; si no, cae a compartir solo el texto, y si
 * tampoco hay `navigator.share`, lo copia al portapapeles.
 */
async function shareWrappedImage(
  stats: WrappedStats,
  watched: WatchedRow[],
  session: ShareSession,
  onShared: () => void
): Promise<"shared-image" | "shared-text" | "copied" | "failed"> {
  const text = shareText(stats);

  try {
    const profile = session ? await fetchMyProfile(session.user.id) : null;

    const blob = await createWrappedShareImage({
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
      year: stats.year,
      displayName: profile?.displayName ?? undefined,
      totalWatched: stats.totalWatched,
      topGenreName: stats.topGenres[0]?.name,
      longestStreak: stats.longestStreak,
      posterUrls: yearPosterUrls(watched, stats.year),
      fontFamily: siteFont(),
    });

    const file = new File([blob], `wrapped-${stats.year}-la-butaca-secreta.png`, {
      type: "image/png",
    });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${SITE_NAME} · Resumen ${stats.year}`,
        text,
      });
      onShared();
      if (session) recordShareEvent(session.user.id, "wrapped");
      return "shared-image";
    }
  } catch {
    // La imagen falló o se canceló el share con archivo: se intenta el texto debajo.
  }

  if (navigator.share) {
    try {
      await navigator.share({ text, title: `Mi ${stats.year} en ${SITE_NAME}` });
      onShared();
      if (session) recordShareEvent(session.user.id, "wrapped");
      return "shared-text";
    } catch {
      // cancelado por el usuario: no pasa nada
      return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    onShared();
    if (session) recordShareEvent(session.user.id, "wrapped");
    return "copied";
  } catch {
    // sin clipboard disponible: no se puede hacer nada más
    return "failed";
  }
}

function siteFont(): string {
  try {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--font-manrope")
      .trim();
  } catch {
    return "";
  }
}

type FinalCardState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; file: File; url: string };

/**
 * Tarjeta final: una imagen real (mismo fondo cinematográfico que el
 * resto de "compartir" de la web, lib/shareImage.ts) con lo más
 * importante del año, no todas las cifras — mismo patrón que
 * ShareSummaryDialog.tsx (genera la imagen al montar, enseña preview,
 * Compartir/Descargar).
 */
function FinalShareCard({
  stats,
  watched,
}: {
  stats: WrappedStats;
  watched: WatchedRow[];
}) {
  const { session } = useAuth();
  const [state, setState] = useState<FinalCardState>({ status: "loading" });
  const [message, setMessage] = useState("");

  const fileName = `wrapped-${stats.year}-la-butaca-secreta.png`;

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function run() {
      const userId = session?.user.id;
      const profile = userId ? await fetchMyProfile(userId) : null;

      const posterUrls = yearPosterUrls(watched, stats.year);

      try {
        const blob = await createWrappedShareImage({
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          year: stats.year,
          displayName: profile?.displayName ?? undefined,
          totalWatched: stats.totalWatched,
          topGenreName: stats.topGenres[0]?.name,
          longestStreak: stats.longestStreak,
          posterUrls,
          fontFamily: siteFont(),
        });

        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setState({
          status: "ready",
          url: objectUrl,
          file: new File([blob], fileName, { type: "image/png" }),
        });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    run();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.year]);

  const file = state.status === "ready" ? state.file : null;

  const canShareFiles =
    !!file &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  async function share() {
    if (!file) return;

    try {
      await navigator.share({
        files: [file],
        title: `${SITE_NAME} · Resumen ${stats.year}`,
        text: shareText(stats),
      });

      track("share_done", { method: "native", screen: "wrapped" });
      if (session) recordShareEvent(session.user.id, "wrapped");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      setMessage(
        "No he podido abrir el menú de compartir. Descarga la imagen y envíala tú."
      );
    }
  }

  function download() {
    if (state.status !== "ready") return;

    const link = document.createElement("a");

    link.href = state.url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setMessage("Imagen descargada. Ya puedes enviarla o subirla.");
    track("share_done", { method: "download", screen: "wrapped" });
    if (session) recordShareEvent(session.user.id, "wrapped");
  }

  return (
    <div className="flex h-full flex-col items-center gap-3 text-center">
      <Eyebrow>Tu {stats.year}, resumido</Eyebrow>

      <div
        className="flex w-full flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black/30"
        aria-live="polite"
      >
        {state.status === "loading" && (
          <p className="px-4 text-sm text-zinc-300">
            Preparando tu imagen…
          </p>
        )}

        {state.status === "error" && (
          <p role="alert" className="px-4 text-sm text-red-300">
            No he podido crear la imagen. Inténtalo de nuevo en unos
            segundos.
          </p>
        )}

        {state.status === "ready" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.url}
            alt={`Tu ${stats.year} en ${SITE_NAME}`}
            className="max-h-full w-auto max-w-full rounded-2xl"
          />
        )}
      </div>

      <div className="flex w-full shrink-0 gap-2">
        {canShareFiles && (
          <button
            type="button"
            onClick={share}
            className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Compartir
          </button>
        )}
        <button
          type="button"
          onClick={download}
          disabled={state.status !== "ready"}
          className={`flex-1 rounded-full px-4 py-3 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 ${
            canShareFiles
              ? "border border-white/20 hover:bg-white/10"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          Descargar imagen
        </button>
      </div>

      {message && (
        <p role="status" className="shrink-0 text-xs text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );
}

/** Botón discreto en la cabecera: comparte el texto del resumen completo desde cualquier pantalla, no solo la última. */
function HeaderShareButton({
  stats,
  watched,
}: {
  stats: WrappedStats;
  watched: WatchedRow[];
}) {
  const { session } = useAuth();
  const [status, setStatus] = useState<"idle" | "working" | "copied">("idle");

  async function handleShare() {
    setStatus("working");

    const result = await shareWrappedImage(stats, watched, session, () =>
      track("share_done", { screen: "wrapped" })
    );

    if (result === "copied") {
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("idle");
    }
  }

  const label =
    status === "working"
      ? "Generando…"
      : status === "copied"
        ? "¡Copiado!"
        : "Compartir";

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={status === "working"}
      aria-label="Compartir tu Resumen Anual"
      className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white disabled:opacity-60"
    >
      <ShareIcon size={13} />
      {label}
    </button>
  );
}

type TitleRef = { tmdbId: number; mediaType: "movie" | "tv" };

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);

  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Foto de TMDb si la hay; si no, las iniciales sobre un color de marca (mismo patrón que los avatares de amigos). */
function PersonAvatar({
  name,
  photoPath,
  gradient,
}: {
  name: string;
  photoPath?: string | null;
  gradient: string;
}) {
  if (photoPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoPath}
        alt=""
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white`}
    >
      {initialsOf(name) || <PersonIcon size={20} />}
    </span>
  );
}

/** "Repetiste con ellos": agrega el reparto de los títulos del año bajo demanda (hooks/useWrappedCastHighlights.ts). */
function CastHighlightsSlide({ titles }: { titles: TitleRef[] }) {
  const { highlights, loading, capped } = useWrappedCastHighlights(titles);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <Eyebrow>Repetiste con ellos</Eyebrow>
        <p className="text-sm text-zinc-400">Mirando el reparto de tus títulos…</p>
      </div>
    );
  }

  const hasActor = Boolean(highlights?.actor);
  const hasDirector = Boolean(highlights?.director);

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Eyebrow>Repetiste con ellos</Eyebrow>

      {!hasActor && !hasDirector && (
        <p className="max-w-[30ch] text-base text-zinc-300">
          Este año no se repitió ningún actor, actriz o director lo bastante
          como para hablar de un patrón. Año de variedad.
        </p>
      )}

      {highlights?.actor && (
        <div className={`${CARD} flex items-center gap-3.5`}>
          <PersonAvatar
            name={highlights.actor.name}
            photoPath={highlights.actor.photoPath}
            gradient="from-red-700 to-amber-800"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Tu actor/actriz más repetido
            </p>
            <p
              className="marquee-font truncate text-2xl text-white"
              style={DISPLAY_TRACKING}
            >
              {highlights.actor.name}
            </p>
            <p className="text-xs font-bold text-amber-300">
              {highlights.actor.count} títulos distintos este año
            </p>
          </div>
        </div>
      )}

      {highlights?.director && (
        <div className={`${CARD} flex items-center gap-3.5`}>
          <PersonAvatar
            name={highlights.director.name}
            photoPath={highlights.director.photoPath}
            gradient="from-blue-700 to-blue-950"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Tu director/a conocido
            </p>
            <p
              className="marquee-font truncate text-2xl text-white"
              style={DISPLAY_TRACKING}
            >
              {highlights.director.name}
            </p>
            <p className="text-xs font-bold text-amber-300">
              {highlights.director.count} títulos suyos este año
            </p>
          </div>
        </div>
      )}

      {capped && (
        <p className="text-[11px] text-zinc-500">
          Calculado sobre tus títulos más recientes del año.
        </p>
      )}
    </div>
  );
}

function PosterThumb({ url }: { url?: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-20 w-14 shrink-0 rounded-lg object-cover"
      />
    );
  }

  return (
    <div className="h-20 w-14 shrink-0 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900" />
  );
}

/** "Trendy y joya oculta": cuánta gente de la app vio cada título del año, bajo demanda (hooks/useWrappedTrendy.ts). */
function TrendySlide({
  year,
  yearRows,
}: {
  year: number;
  yearRows: WatchedRow[];
}) {
  const { highlights, loading } = useWrappedTrendy(year, yearRows);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <Eyebrow>Trendy y joya oculta</Eyebrow>
        <p className="text-sm text-zinc-400">
          Mirando qué ha visto el resto…
        </p>
      </div>
    );
  }

  const trendy = highlights?.trendy;
  const hiddenGem = highlights?.hiddenGem;

  if (!trendy && !hiddenGem) {
    return (
      <div className="flex h-full flex-col justify-center gap-4">
        <Eyebrow>Trendy y joya oculta</Eyebrow>
        <p className="max-w-[30ch] text-base text-zinc-300">
          Todavía no hay suficiente gente en {SITE_NAME} comparando
          títulos contigo para calcular esto. Vuelve más adelante.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Eyebrow>Trendy y joya oculta</Eyebrow>

      {trendy && (
        <div
          className={`${CARD} flex items-center gap-3.5 border-red-500/25 bg-red-500/5`}
        >
          <PosterThumb url={trendy.posterUrl} />
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-red-300">
              <FireIcon size={12} /> Lo más trendy que viste
            </p>
            <p
              className="marquee-font truncate text-xl text-white"
              style={DISPLAY_TRACKING}
            >
              {trendy.title}
            </p>
            <p className="text-xs text-zinc-400">
              La vieron {Math.max(0, trendy.watcherCount - 1)}{" "}
              {trendy.watcherCount - 1 === 1 ? "persona más" : "personas más"}{" "}
              en {SITE_NAME}.
            </p>
          </div>
        </div>
      )}

      {hiddenGem && (
        <div
          className={`${CARD} flex items-center gap-3.5 border-amber-400/25 bg-amber-400/5`}
        >
          <PosterThumb url={hiddenGem.posterUrl} />
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-300">
              <GemIcon size={12} /> Tu joya oculta
            </p>
            <p
              className="marquee-font truncate text-xl text-white"
              style={DISPLAY_TRACKING}
            >
              {hiddenGem.title}
            </p>
            <p className="text-xs text-zinc-400">
              Le diste {"★".repeat(Math.round(hiddenGem.rating))} y casi
              nadie más la ha visto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** "Tu grupo de cine": compatibilidad con cada amigo aceptado, agregada bajo demanda (hooks/useWrappedFriendsGroup.ts). */
function FriendsGroupSlide({
  userId,
  myHistory,
}: {
  userId: string;
  myHistory: WatchedRow[];
}) {
  const { summary, friendCount, loading } = useWrappedFriendsGroup(
    userId,
    myHistory
  );

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <Eyebrow>Tu grupo de cine</Eyebrow>
        <p className="text-sm text-zinc-400">Comparando con tus amigos…</p>
      </div>
    );
  }

  if (friendCount === 0) {
    return (
      <div className="flex h-full flex-col justify-center gap-4">
        <Eyebrow>Tu grupo de cine</Eyebrow>
        <h2
          className="marquee-font text-4xl leading-[0.95] text-white"
          style={DISPLAY_TRACKING}
        >
          Todavía vas solo.
        </h2>
        <p className="max-w-[30ch] text-base text-zinc-300">
          Añade amigos desde tu perfil para ver cuánto coincidís este año.
        </p>
      </div>
    );
  }

  if (!summary || summary.groupAveragePercent === null) {
    return (
      <div className="flex h-full flex-col justify-center gap-4">
        <Eyebrow>Tu grupo de cine</Eyebrow>
        <p className="max-w-[30ch] text-base text-zinc-300">
          Tienes {friendCount} {friendCount === 1 ? "amigo" : "amigos"}, pero
          todavía no hay suficientes valoraciones en común para calcular la
          compatibilidad.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Eyebrow>Tu grupo de cine</Eyebrow>
      <h2
        className="marquee-font text-4xl leading-[0.95] text-white"
        style={DISPLAY_TRACKING}
      >
        {friendCount} {friendCount === 1 ? "amigo" : "amigos"}.
        <br />
        ¿Mismo gusto?
      </h2>
      <div
        className={`${CARD} flex items-center gap-4 border-amber-400/25 bg-amber-400/5`}
      >
        <p
          className="marquee-font text-4xl text-amber-300"
          style={DISPLAY_TRACKING}
        >
          {summary.groupAveragePercent}%
        </p>
        <p className="text-sm text-zinc-300">
          Compatibilidad media con tu grupo ({summary.readyCount} de{" "}
          {friendCount})
        </p>
      </div>

      {summary.top.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
            Tus mejores coincidencias
          </p>
          {summary.top.map((entry, i) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                i === 0
                  ? "border-amber-400/40 bg-amber-400/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <span className="marquee-font w-5 text-base text-zinc-400">
                {i + 1}
              </span>
              <span className="flex-1 truncate text-sm font-bold text-white">
                {entry.name}
              </span>
              <span className="marquee-font text-lg text-amber-300">
                {entry.percent}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Flechita fina a un lado, solo para indicar que hay que tocar/deslizar; no capta toques (el tapzone de debajo sigue haciéndolo). */
function SideArrow({ side }: { side: "left" | "right" }) {
  return (
    <svg
      className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-white/20 ${
        side === "left" ? "left-1" : "right-1"
      }`}
      width="7"
      height="22"
      viewBox="0 0 7 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={side === "left" ? "M6 1L1 11L6 21" : "M1 1L6 11L1 21"}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WrappedScreen({ year, onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const { session } = useAuth();
  const { stats, loading, watched } = useWrapped(year);
  const [index, setIndex] = useState(0);

  const slides = stats ? buildSlides(stats) : [];

  if (stats) {
    const yearRows = watched.filter(
      (row) => new Date(row.seenAt).getFullYear() === year
    );
    const yearTitles: TitleRef[] = yearRows.map((row) => ({
      tmdbId: row.tmdbId,
      mediaType: row.mediaType,
    }));

    // "Repetiste con ellos" y "Trendy y joya oculta" van justo después
    // del género (como en el mockup: Género → Actor → … → Trendy),
    // antes de que el progreso cierre el bloque de datos del año.
    const genreIndex = slides.findIndex((s) => s.id === "genero");
    const insertAt = genreIndex === -1 ? slides.length : genreIndex + 1;

    slides.splice(
      insertAt,
      0,
      { id: "cara", node: <CastHighlightsSlide titles={yearTitles} /> },
      { id: "trendy", node: <TrendySlide year={year} yearRows={yearRows} /> }
    );

    if (session) {
      slides.push({
        id: "amigos",
        node: <FriendsGroupSlide userId={session.user.id} myHistory={watched} />,
      });
    }
  }

  const total = slides.length + (stats ? 1 : 0); // +1 por la pantalla de compartir

  const currentWrapId =
    index < slides.length ? slides[index]?.id : "final";
  const currentWrap = GIFT_WRAPS[currentWrapId ?? "portada"] ?? GIFT_WRAPS.portada;

  function go(delta: 1 | -1) {
    setIndex((current) => {
      const next = current + delta;
      if (next < 0) return current;
      if (next >= total) {
        onClose();
        return current;
      }
      return next;
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Resumen Anual ${year}`}
        tabIndex={-1}
        className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden sm:h-[90dvh] sm:rounded-[2rem] sm:border sm:border-white/10"
        style={{ background: SITE_BACKGROUND }}
      >
        <div className="relative shrink-0">
          <div className="flex gap-1.5 px-5 pt-5">
            {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full ${
                  i <= index ? "bg-amber-400" : "bg-white/15"
                }`}
              />
            ))}
          </div>

          {!loading && stats && index !== slides.length && (
            <HeaderShareButton stats={stats} watched={watched} />
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Resumen Anual"
            className="absolute right-4 top-4 z-20 rounded-full bg-black/40 p-1.5 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden px-6 py-4">
          <GiftWrapLayer wrap={currentWrap} slideId={currentWrapId ?? "portada"} />

          {loading && (
            <p className="flex h-full items-center justify-center text-sm text-zinc-400">
              Preparando tu año…
            </p>
          )}

          {!loading && stats && index < slides.length && slides[index].node}

          {!loading && stats && index === slides.length && (
            <FinalShareCard stats={stats} watched={watched} />
          )}

          {!loading && !stats && (
            <p className="flex h-full items-center justify-center text-sm text-zinc-400">
              Todavía no hay nada que resumir de {year}.
            </p>
          )}

          {!loading && stats && (
            <>
              {index > 0 && <SideArrow side="left" />}
              {index < total - 1 && <SideArrow side="right" />}
              <button
                type="button"
                aria-label="Pantalla anterior"
                onClick={() => go(-1)}
                className="absolute inset-y-0 left-0 w-1/3"
              />
              <button
                type="button"
                aria-label="Siguiente pantalla"
                onClick={() => go(1)}
                className="absolute inset-y-0 right-0 w-1/3"
              />
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
