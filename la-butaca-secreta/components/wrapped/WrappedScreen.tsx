"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/hooks/useAuth";
import { useDialog } from "@/hooks/useDialog";
import { useWrapped } from "@/hooks/useWrapped";
import { useWrappedCastHighlights } from "@/hooks/useWrappedCastHighlights";
import { useWrappedFriendsGroup } from "@/hooks/useWrappedFriendsGroup";
import { track } from "@/lib/analytics";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { recordShareEvent } from "@/lib/supabase/achievements";
import type { WatchedRow } from "@/lib/supabase/summary";
import type { WrappedStats } from "@/lib/wrapped";
import {
  DiscardIcon,
  FireIcon,
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

// Fondo del Resumen = el mismo de toda la web (app/globals.css, body),
// no uno propio: mismos tonos (rojo arriba-izquierda, azul
// arriba-derecha) para que el Wrapped se sienta parte de la app.
const SITE_BACKGROUND =
  "radial-gradient(circle at top left, rgba(220,38,38,0.18), transparent 30%), radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 30%), linear-gradient(180deg, #050505 0%, #09090b 40%, #050505 100%)";

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

/** Lógica de compartir común a la pantalla final y al botón rápido de la cabecera. */
async function performShare(
  stats: WrappedStats,
  session: ShareSession,
  onShared: () => void
): Promise<"shared" | "copied" | "failed"> {
  const text = shareText(stats);

  if (navigator.share) {
    try {
      await navigator.share({ text, title: `Mi ${stats.year} en ${SITE_NAME}` });
      onShared();
      if (session) recordShareEvent(session.user.id, "wrapped");
      return "shared";
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

function ShareSlide({ stats, onShared }: { stats: WrappedStats; onShared: () => void }) {
  const { session } = useAuth();
  const [copied, setCopied] = useState(false);

  async function share() {
    const result = await performShare(stats, session, onShared);
    if (result === "copied") setCopied(true);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <Eyebrow>Tu {stats.year}, en una frase</Eyebrow>
      <h2
        className="marquee-font text-4xl leading-[0.95] text-white"
        style={DISPLAY_TRACKING}
      >
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

/** Botón discreto en la cabecera: comparte el texto del resumen completo desde cualquier pantalla, no solo la última. */
function HeaderShareButton({ stats }: { stats: WrappedStats }) {
  const { session } = useAuth();
  const [justCopied, setJustCopied] = useState(false);

  async function handleShare() {
    const result = await performShare(stats, session, () =>
      track("share_done", { screen: "wrapped" })
    );

    if (result === "copied") {
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Compartir tu Resumen Anual"
      className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white"
    >
      <ShareIcon size={13} />
      {justCopied ? "¡Copiado!" : "Compartir"}
    </button>
  );
}

type TitleRef = { tmdbId: number; mediaType: "movie" | "tv" };

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
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-700 to-amber-800 text-white">
            <PersonIcon size={20} />
          </span>
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
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-blue-950 text-white">
            <PersonIcon size={20} />
          </span>
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
    const yearTitles: TitleRef[] = watched
      .filter((row) => new Date(row.seenAt).getFullYear() === year)
      .map((row) => ({ tmdbId: row.tmdbId, mediaType: row.mediaType }));

    // "Repetiste con ellos" va justo después del género (como en el
    // mockup: Género → Actor), antes de que el progreso cierre el
    // bloque de datos del año.
    const genreIndex = slides.findIndex((s) => s.id === "genero");
    slides.splice(genreIndex === -1 ? slides.length : genreIndex + 1, 0, {
      id: "cara",
      node: <CastHighlightsSlide titles={yearTitles} />,
    });

    if (session) {
      slides.push({
        id: "amigos",
        node: <FriendsGroupSlide userId={session.user.id} myHistory={watched} />,
      });
    }
  }

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
            <HeaderShareButton stats={stats} />
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
