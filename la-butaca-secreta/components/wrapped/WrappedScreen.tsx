"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/hooks/useAuth";
import { useDialog } from "@/hooks/useDialog";
import { useWrapped } from "@/hooks/useWrapped";
import { track } from "@/lib/analytics";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { recordShareEvent } from "@/lib/supabase/achievements";
import type { WrappedStats } from "@/lib/wrapped";

type Props = {
  year: number;
  onClose: () => void;
};

type Slide = { id: string; node: React.ReactNode };

const CARD =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm";

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
        <h1 className="marquee-font text-6xl leading-[0.92] text-white">
          Tu año
          <br />
          en butaca.
        </h1>
        <p className="max-w-[28ch] text-base leading-relaxed text-zinc-300">
          Esto es lo que ha dado de sí tu {stats.year} en {SITE_NAME}.
        </p>
      </div>
    ),
  });

  slides.push({
    id: "total",
    node: (
      <div className="flex h-full flex-col justify-center gap-4">
        <Eyebrow>Lo viste todo</Eyebrow>
        <div>
          <span className="marquee-font text-8xl leading-[0.85] text-white">
            {stats.totalWatched}
          </span>
          <span className="ml-1 text-xl font-extrabold text-zinc-300">
            títulos
          </span>
        </div>
        <p className="max-w-[30ch] text-base text-zinc-300">
          Entre películas y series, así fue tu {stats.year}.
        </p>
        <div className="flex gap-3">
          <div className={`${CARD} flex-1`}>
            <p className="marquee-font text-4xl text-amber-300">
              {stats.movieCount}
            </p>
            <p className="text-xs text-zinc-400">películas</p>
          </div>
          <div className={`${CARD} flex-1`}>
            <p className="marquee-font text-4xl text-amber-300">
              {stats.seriesCount}
            </p>
            <p className="text-xs text-zinc-400">series</p>
          </div>
        </div>
        <p className="rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
          ⏱ Unas {stats.approxHours} horas de pantalla (estimación
          aproximada).
        </p>
      </div>
    ),
  });

  if (stats.topGenres.length > 0) {
    const [first, ...rest] = stats.topGenres;

    slides.push({
      id: "genero",
      node: (
        <div className="flex h-full flex-col justify-center gap-4">
          <Eyebrow>Tu género del año</Eyebrow>
          <h2 className="marquee-font text-5xl leading-[0.95] text-white">
            {first.name},
            <br />
            sin duda.
          </h2>
          <p className="text-base text-zinc-300">
            El {first.percent}% de lo que viste fue de este género. Tu
            top:
          </p>
          <div className="flex flex-col gap-2">
            {[first, ...rest].map((g, i) => (
              <div
                key={g.name}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                  i === 0
                    ? "border-amber-400/40 bg-amber-400/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <span className="marquee-font w-5 text-lg text-zinc-400">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-bold text-white">
                  {g.name}
                </span>
                <span className="text-sm text-zinc-400">{g.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  if (stats.longestStreak > 1 || stats.peakMonth) {
    slides.push({
      id: "racha",
      node: (
        <div className="flex h-full flex-col justify-center gap-4">
          <Eyebrow>Constancia</Eyebrow>
          {stats.longestStreak > 1 && (
            <div>
              <span className="marquee-font text-8xl leading-[0.85] text-white">
                {stats.longestStreak}
              </span>
              <span className="ml-1 text-sm font-extrabold text-zinc-300">
                días seguidos, tu racha más larga
              </span>
            </div>
          )}
          {stats.peakMonth && (
            <p className="max-w-[30ch] text-base text-zinc-300">
              Y {stats.peakMonth.label} fue tu mes fuerte, con{" "}
              {stats.peakMonth.count}{" "}
              {stats.peakMonth.count === 1 ? "título" : "títulos"}.
            </p>
          )}
          <div className="flex h-24 items-end gap-1">
            {stats.monthlyCounts.map((m) => {
              const max = Math.max(1, ...stats.monthlyCounts.map((x) => x.count));
              return (
                <div key={m.monthIndex} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t ${
                      stats.peakMonth?.monthIndex === m.monthIndex
                        ? "bg-gradient-to-t from-red-600 to-amber-400"
                        : "bg-white/15"
                    }`}
                    style={{ height: `${Math.max(6, (m.count / max) * 100)}%` }}
                  />
                  <span
                    className={`text-[9px] ${
                      stats.peakMonth?.monthIndex === m.monthIndex
                        ? "font-bold text-amber-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {m.label.charAt(0).toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ),
    });
  }

  if (stats.peakDay) {
    slides.push({
      id: "dia",
      node: (
        <div className="flex h-full flex-col justify-center gap-4">
          <Eyebrow>Tu pico del año</Eyebrow>
          <h2 className="marquee-font text-5xl leading-[0.95] text-white">
            {new Date(stats.peakDay.date).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
            })}
          </h2>
          <p className="max-w-[30ch] text-base text-zinc-300">
            Fue tu día más visto: {stats.peakDay.count} títulos en una
            sola sesión.
          </p>
          <div className="flex flex-col gap-1.5">
            {stats.peakDay.titles.slice(0, 5).map((title, i) => (
              <div
                key={`${title}-${i}`}
                className="truncate rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200"
              >
                {title}
              </div>
            ))}
          </div>
          <p className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-200">
            🍿 Maratón en toda regla.
          </p>
        </div>
      ),
    });
  }

  if (stats.oldestPendingTitle || stats.rejectedThisYearCount > 0) {
    slides.push({
      id: "pendientes",
      node: (
        <div className="flex h-full flex-col justify-center gap-4">
          {stats.oldestPendingTitle && (
            <div className={`${CARD} flex items-center gap-3 border-amber-400/30`}>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-300">
                  ⏳ Lleva más tiempo esperando
                </p>
                <p className="marquee-font text-xl text-white">
                  {stats.oldestPendingTitle}
                </p>
                <p className="text-xs text-zinc-400">
                  En tus Pendientes desde hace{" "}
                  {stats.oldestPendingMonths ?? 0} meses.
                </p>
              </div>
            </div>
          )}

          <div className={`${CARD} flex items-center gap-4`}>
            <span className="marquee-font text-5xl text-white">
              {stats.rejectedThisYearCount}
            </span>
            <p className="text-sm text-zinc-300">
              títulos que descartaste con &ldquo;No me apetece&rdquo; este
              año — de lo que te recomendamos, estos no te apetecían.
            </p>
          </div>
        </div>
      ),
    });
  }

  if (stats.canonTotalProgress > 0) {
    slides.push({
      id: "canon",
      node: (
        <div className="flex h-full flex-col justify-center gap-4">
          <Eyebrow>El Canon</Eyebrow>
          <h2 className="marquee-font text-5xl leading-[0.95] text-white">
            {stats.canonThisYear} clásicos
            <br />
            más este año.
          </h2>
          <p className="max-w-[30ch] text-base text-zinc-300">
            Sumaste {stats.canonThisYear} películas nuevas a El Canon —
            vas construyendo tu cultura cinéfila poco a poco.
          </p>
          <div className={`${CARD} flex items-center gap-4`}>
            <div className="flex-1">
              <p className="text-xs text-zinc-400">Tu progreso total</p>
              <p className="marquee-font text-3xl text-white">
                {stats.canonTotalProgress} / {stats.canonTotal}
              </p>
              <p className="text-xs font-bold text-amber-300">
                +{stats.canonThisYear} este año
              </p>
            </div>
          </div>
        </div>
      ),
    });
  }

  if (stats.achievementsThisYear.length > 0) {
    slides.push({
      id: "logros",
      node: (
        <div className="flex h-full flex-col justify-center gap-4">
          <Eyebrow>Tus logros</Eyebrow>
          <h2 className="marquee-font text-5xl leading-[0.95] text-white">
            {stats.achievementsThisYear.length} insignias
            <br />
            nuevas este año.
          </h2>
          <div className="flex flex-col gap-2">
            {stats.achievementsThisYear.map((a) => (
              <div
                key={`${a.key}-${a.level}`}
                className={`${CARD} flex items-center gap-3`}
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
          <p className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-200">
            ⭐ En total llevas {stats.achievementsTotalUnlocked} niveles
            desbloqueados desde que usas {SITE_NAME}.
          </p>
        </div>
      ),
    });
  }

  if (stats.lastOfYear) {
    slides.push({
      id: "ultima",
      node: (
        <div className="flex h-full flex-col justify-center gap-4">
          <Eyebrow>Así cerraste el año</Eyebrow>
          <h2 className="marquee-font text-5xl leading-[0.95] text-white">
            Lo último
            <br />
            que viste.
          </h2>
          <div className={`${CARD}`}>
            <p className="marquee-font text-2xl text-white">
              {stats.lastOfYear.title}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {new Date(stats.lastOfYear.seenAt).toLocaleDateString(
                "es-ES",
                { day: "numeric", month: "long" }
              )}
            </p>
            {stats.lastOfYear.rating && (
              <p className="mt-1 text-sm text-amber-300">
                {"★".repeat(Math.round(stats.lastOfYear.rating))}
              </p>
            )}
          </div>
        </div>
      ),
    });
  }

  return slides;
}

function ShareSlide({ stats, onShared }: { stats: WrappedStats; onShared: () => void }) {
  const { session } = useAuth();
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = shareText(stats);

    if (navigator.share) {
      try {
        await navigator.share({ text, title: `Mi ${stats.year} en ${SITE_NAME}` });
        onShared();
        if (session) recordShareEvent(session.user.id, "wrapped");
        return;
      } catch {
        // cancelado por el usuario: no pasa nada
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onShared();
      if (session) recordShareEvent(session.user.id, "wrapped");
    } catch {
      // sin clipboard disponible: no se puede hacer nada más
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <Eyebrow>Tu {stats.year}, en una frase</Eyebrow>
      <h2 className="marquee-font text-4xl leading-[0.95] text-white">
        {stats.totalWatched} títulos.
        <br />
        {stats.topGenres[0]?.name ?? "Un año"} de cine.
      </h2>
      <button
        type="button"
        onClick={share}
        className="rounded-full bg-red-600 px-8 py-4 text-sm font-bold text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Compartir
      </button>
      {copied && (
        <p className="text-xs text-zinc-400">Copiado — pégalo donde quieras.</p>
      )}
    </div>
  );
}

export default function WrappedScreen({ year, onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const { stats, loading } = useWrapped(year);
  const [index, setIndex] = useState(0);

  const slides = stats ? buildSlides(stats) : [];
  const total = slides.length + (stats ? 1 : 0); // +1 por la pantalla de compartir

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
        className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-950 to-black sm:h-[90dvh] sm:rounded-[2rem] sm:border sm:border-white/10"
      >
        <div className="relative" style={{
          background:
            "radial-gradient(circle at 15% 8%, rgba(220,38,38,0.25), transparent 38%), radial-gradient(circle at 88% 6%, rgba(251,191,36,0.12), transparent 30%)",
        }}>
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
          {loading && (
            <p className="flex h-full items-center justify-center text-sm text-zinc-400">
              Preparando tu año…
            </p>
          )}

          {!loading && stats && index < slides.length && slides[index].node}

          {!loading && stats && index === slides.length && (
            <ShareSlide stats={stats} onShared={() => track("share_done", { screen: "wrapped" })} />
          )}

          {!loading && !stats && (
            <p className="flex h-full items-center justify-center text-sm text-zinc-400">
              Todavía no hay nada que resumir de {year}.
            </p>
          )}

          {!loading && stats && (
            <>
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
