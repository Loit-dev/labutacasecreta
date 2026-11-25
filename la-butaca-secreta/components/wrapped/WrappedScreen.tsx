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
import { DiscardIcon, FireIcon, PinIcon } from "@/components/icons/Icons";

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

  const hasPendingOrRejected =
    stats.oldestPendingTitle || stats.rejectedThisYearCount > 0;
  const hasStreakInfo = stats.longestStreak > 1 || stats.peakMonth;

  slides.push({
    id: "total",
    node: (
      <div className="flex h-full flex-col justify-center gap-3">
        <Eyebrow>Tu año en cifras</Eyebrow>
        <div>
          <span className="marquee-font text-7xl leading-[0.85] text-white">
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
              <h2 className="marquee-font text-4xl leading-[0.95] text-white">
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
        className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden sm:h-[90dvh] sm:rounded-[2rem] sm:border sm:border-white/10"
        style={{
          background:
            "radial-gradient(circle at 15% 8%, rgba(220,38,38,0.30), transparent 38%), radial-gradient(circle at 88% 6%, rgba(251,191,36,0.14), transparent 32%), linear-gradient(180deg, #18181b 0%, #0c0c0d 45%, #050505 100%)",
        }}
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
