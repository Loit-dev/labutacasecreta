"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { track } from "@/lib/analytics";
import { genreEmoji } from "@/lib/genreEmoji";
import { countRejected } from "@/lib/rejected";
import { posterSource } from "@/lib/share";
import type { SearchHit } from "@/lib/search";
import { fetchFavorite, saveFavorite } from "@/lib/supabase/favorite";
import { fetchMonthRank, fetchWatchedHistory } from "@/lib/supabase/summary";
import {
  buildSummary,
  competitiveLine,
  type SummaryStats,
} from "@/lib/summary";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Recommendation } from "@/lib/tmdb/mapper";

import FavoriteCard from "./FavoriteCard";
import FavoritePickerDialog from "./FavoritePickerDialog";
import ShareSummaryDialog from "./ShareSummaryDialog";
import SummaryTitleCard from "./SummaryTitleCard";

type TitleEntry = { mediaType: "movie" | "tv"; data: Recommendation };

type Titles = {
  lastWatched?: TitleEntry;
  bestRated?: TitleEntry;
  favorite?: TitleEntry;
};

type Poster = { lastWatched?: string; bestRated?: string; favorite?: string };

type State =
  | { status: "loading" }
  | { status: "empty" }
  | {
      status: "ready";
      stats: SummaryStats;
      line?: string;
      posters: Poster;
      titles: Titles;
    };

async function fetchTitle(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<Recommendation | undefined> {
  try {
    const response = await fetch(
      `/api/resumen-title?type=${mediaType}&id=${tmdbId}`
    );

    if (!response.ok) return undefined;

    return (await response.json()) as Recommendation;
  } catch {
    return undefined;
  }
}

const CARD = `
  rounded-3xl
  border
  border-white/20
  bg-black/5
  md:bg-black/15
  lg:bg-black/30
  backdrop-blur-sm
  md:backdrop-blur-xl
  lg:backdrop-blur-2xl
  shadow-2xl
`;

function Bars({ last14 }: { last14: SummaryStats["last14"] }) {
  const max = Math.max(1, ...last14.map((d) => d.count));

  return (
    <div
      className="flex h-28 items-end gap-1.5"
      role="img"
      aria-label={`Vistas de los últimos 14 días: ${last14
        .map((d) => `${d.date}: ${d.count}`)
        .join(", ")}`}
    >
      {last14.map((d) => (
        <div
          key={d.date}
          className="flex h-full flex-1 flex-col items-center justify-end"
          title={`${d.date}: ${d.count}`}
        >
          {/* Altura fija siempre reservada, aunque esté vacía, para que
              todas las barras sigan arrancando a la misma altura. */}
          <span className="mb-1 h-3 text-[9px] font-bold leading-3 text-amber-300">
            {d.count > 0 ? d.count : ""}
          </span>

          <div
            className="w-full rounded-t-md bg-gradient-to-t from-orange-600 to-amber-400"
            style={{
              height: `${Math.max(6, (d.count / max) * 100)}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Mismos 3 colores que las tarjetas de "Mis sugerencias" (MI APUESTA /
// OTRA OPCIÓN / SORPRESA), reutilizados aquí para el ranking de géneros.
const GENRE_RANKS = [
  {
    label: "TOP 1",
    row: "border-yellow-500/40",
    chip: "border-yellow-400/70 bg-yellow-400/10 text-yellow-300",
  },
  {
    label: "TOP 2",
    row: "border-zinc-300/30",
    chip: "border-zinc-300/60 bg-zinc-300/10 text-zinc-200",
  },
  {
    label: "TOP 3",
    row: "border-orange-500/40",
    chip: "border-orange-400/70 bg-orange-400/10 text-orange-300",
  },
];

export default function MiResumenScreen() {
  const { session, loading, available } = useAuth();

  const [state, setState] = useState<State>({ status: "loading" });

  const [sharing, setSharing] = useState(false);

  const [picking, setPicking] = useState(false);

  const [savingFavorite, setSavingFavorite] = useState(false);

  const watchlist = useWatchlist();

  const [rejectedCount, setRejectedCount] = useState(0);

  useEffect(() => {
    setRejectedCount(countRejected());
  }, []);

  async function loadSummary(
    userId: string,
    cancelledRef: { current: boolean }
  ) {
    setState({ status: "loading" });

    const [rows, rank, favorite] = await Promise.all([
      fetchWatchedHistory(userId),
      fetchMonthRank(),
      fetchFavorite(userId),
    ]);

    if (cancelledRef.current) return;

    if (rows.length === 0 && !favorite) {
      setState({ status: "empty" });
      track("summary_no_data");
      return;
    }

    const stats = buildSummary(rows);

    const line = rank
      ? competitiveLine(rank.percentile, rank.totalUsers, rank.mine)
      : undefined;

    const posters: Poster = {};
    const titles: Titles = {};

    // Evita pedir dos veces la misma ficha si última vista y mejor
    // valorada (o la favorita) coinciden
    const cache = new Map<string, Promise<Recommendation | undefined>>();

    function loadTitle(tmdbId: number, mediaType: "movie" | "tv") {
      const key = `${mediaType}-${tmdbId}`;

      if (!cache.has(key)) {
        cache.set(key, fetchTitle(tmdbId, mediaType));
      }

      return cache.get(key)!;
    }

    const [lastData, bestData, favData] = await Promise.all([
      stats.lastWatched
        ? loadTitle(stats.lastWatched.tmdbId, stats.lastWatched.mediaType)
        : Promise.resolve(undefined),
      stats.bestRated
        ? loadTitle(stats.bestRated.tmdbId, stats.bestRated.mediaType)
        : Promise.resolve(undefined),
      favorite
        ? loadTitle(favorite.tmdbId, favorite.mediaType)
        : Promise.resolve(undefined),
    ]);

    if (cancelledRef.current) return;

    if (stats.lastWatched && lastData) {
      titles.lastWatched = { mediaType: stats.lastWatched.mediaType, data: lastData };
      posters.lastWatched = posterSource(lastData.poster);
    }

    if (stats.bestRated && bestData) {
      titles.bestRated = { mediaType: stats.bestRated.mediaType, data: bestData };
      posters.bestRated = posterSource(bestData.poster);
    }

    if (favorite && favData) {
      titles.favorite = { mediaType: favorite.mediaType, data: favData };
      posters.favorite = posterSource(favData.poster);
    }

    setState({ status: "ready", stats, line, posters, titles });

    track("summary_open");
  }

  useEffect(() => {
    if (!session) return;

    const cancelledRef = { current: false };

    loadSummary(session.user.id, cancelledRef);

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function pickFavorite(hit: SearchHit) {
    setPicking(false);

    if (!session) return;

    setSavingFavorite(true);

    const ok = await saveFavorite({
      userId: session.user.id,
      tmdbId: hit.id,
      mediaType: hit.type,
      title: hit.title,
    });

    if (ok) {
      track("summary_open", { favorite_set: true });

      const data = await fetchTitle(hit.id, hit.type);

      setState((current) =>
        current.status === "ready"
          ? {
              ...current,
              titles: {
                ...current.titles,
                favorite: data
                  ? { mediaType: hit.type, data }
                  : current.titles.favorite,
              },
              posters: {
                ...current.posters,
                favorite: data
                  ? posterSource(data.poster)
                  : current.posters.favorite,
              },
            }
          : current
      );
    }

    setSavingFavorite(false);
  }

  if (!available) {
    return (
      <p className="text-center text-sm text-zinc-300">
        El login no está disponible en este momento, así que Mi Resumen
        tampoco. Prueba más tarde.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-center text-sm text-zinc-300">Cargando…</p>
    );
  }

  if (!session) {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm text-zinc-300">
          Mi Resumen necesita una cuenta: así puede guardar tu historial
          entre dispositivos y mostrártelo aquí.
        </p>

        <a
          href="/entrar"
          className="inline-block rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Entrar
        </a>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <p className="text-center text-sm text-zinc-300">
        Preparando tu resumen…
      </p>
    );
  }

  if (state.status === "empty") {
    return (
      <p className="text-center text-sm text-zinc-300">
        Todavía no hay nada que resumir. Marca alguna película o serie
        como "Ya la vi" y vuelve por aquí.
      </p>
    );
  }

  const { stats, titles } = state;

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="marquee-font text-3xl text-white">
          {stats.headline}
        </h1>

        <p className="mt-1 text-sm text-zinc-400">
          Tu {stats.monthLabel.toLowerCase()} en {SITE_NAME}
        </p>
      </div>

      <div className={`${CARD} p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-white">
            Vistas · últimos 14 días
          </span>

          <span className="text-sm font-bold text-orange-400">
            {stats.last14.reduce((sum, d) => sum + d.count, 0)}
          </span>
        </div>

        <Bars last14={stats.last14} />
      </div>

      <div
        className={`grid gap-2 sm:gap-3 ${
          (() => {
            const cols =
              2 +
              (stats.streakDays >= 1 ? 1 : 0) +
              ((stats.averageRating ?? 0) > 0 ? 1 : 0);

            return cols === 4
              ? "grid-cols-2 sm:grid-cols-4"
              : cols === 3
                ? "grid-cols-3"
                : "grid-cols-2";
          })()
        }`}
      >
        <div className={`${CARD} p-3 text-center sm:p-4`}>
          <p className="whitespace-nowrap text-[10px] font-bold tracking-wide text-zinc-400 sm:text-[11px]">
            TOTALES
          </p>
          <p className="mt-1 text-2xl font-black text-white sm:text-3xl">
            {stats.totalWatched}
          </p>
        </div>

        <div className={`${CARD} p-3 text-center sm:p-4`}>
          <p className="whitespace-nowrap text-[10px] font-bold tracking-wide text-zinc-400 sm:text-[11px]">
            ESTE MES{stats.monthBadge ? ` ${stats.monthBadge}` : ""}
          </p>
          <p
            className={`mt-1 text-2xl font-black sm:text-3xl ${
              stats.monthBadge ? "text-amber-300" : "text-white"
            }`}
          >
            {stats.monthCount}
          </p>
          {stats.previousMonthCount > 0 && (
            <p className="mt-1 text-xs text-zinc-400">
              {stats.monthDiff > 0 ? `+${stats.monthDiff}` : stats.monthDiff}{" "}
              vs {stats.previousMonthLabel.toLowerCase()}
            </p>
          )}
        </div>

        {stats.streakDays >= 1 && (
          <div className={`${CARD} p-3 text-center sm:p-4`}>
            <p className="whitespace-nowrap text-[10px] font-bold tracking-wide text-zinc-400 sm:text-[11px]">
              RACHA 🔥
            </p>
            <p className="mt-1 text-2xl font-black text-orange-300 sm:text-3xl">
              {stats.streakDays}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {stats.streakDays === 1 ? "día" : "días seguidos"}
            </p>
          </div>
        )}

        {(stats.averageRating ?? 0) > 0 && (
          <div className={`${CARD} p-3 text-center sm:p-4`}>
            <p className="whitespace-nowrap text-[10px] font-bold tracking-wide text-zinc-400 sm:text-[11px]">
              NOTA MEDIA
            </p>
            <p className="mt-1 text-2xl font-black text-amber-300 sm:text-3xl">
              ★ {stats.averageRating}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className={`${CARD} p-3 text-center sm:p-4`}>
          <p className="whitespace-nowrap text-[10px] font-bold tracking-wide text-zinc-400 sm:text-[11px]">
            PENDIENTES 📌
          </p>
          <p className="mt-1 text-2xl font-black text-white sm:text-3xl">
            {watchlist.count}
          </p>
        </div>

        <div className={`${CARD} p-3 text-center sm:p-4`}>
          <p className="whitespace-nowrap text-[10px] font-bold tracking-wide text-zinc-400 sm:text-[11px]">
            DESCARTADAS 🙅
          </p>
          <p className="mt-1 text-2xl font-black text-zinc-300 sm:text-3xl">
            {rejectedCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {titles.lastWatched ? (
          <SummaryTitleCard
            badge="👁"
            badgeTitle="ÚLTIMA VISTA"
            mediaType={titles.lastWatched.mediaType}
            title={titles.lastWatched.data}
          />
        ) : (
          <div className={`${CARD} flex h-28 items-center justify-center p-2 text-center text-[11px] text-zinc-400 sm:h-36 md:h-40`}>
            Aún sin datos
          </div>
        )}

        {titles.favorite ? (
          <div className="relative">
            <SummaryTitleCard
              badge="⭐"
              badgeTitle="TU FAVORITA"
              mediaType={titles.favorite.mediaType}
              title={titles.favorite.data}
            />

            <button
              type="button"
              onClick={() => setPicking(true)}
              aria-label="Cambiar tu favorita"
              className="absolute right-1 top-1 z-10 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <FavoriteCard onClick={() => setPicking(true)} />
        )}

        {titles.bestRated ? (
          <SummaryTitleCard
            badge="🏆"
            badgeTitle="MEJOR VALORADA"
            mediaType={titles.bestRated.mediaType}
            title={titles.bestRated.data}
          />
        ) : (
          <div className={`${CARD} flex h-28 items-center justify-center p-2 text-center text-[11px] text-zinc-400 sm:h-36 md:h-40`}>
            Aún sin datos
          </div>
        )}
      </div>

      {stats.topGenres.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-white">Tus géneros</p>

          {stats.topGenres.map((genre, index) => {
            const rank = GENRE_RANKS[index];

            return (
              <div
                key={genre.name}
                className={`flex items-center justify-between gap-3 rounded-2xl border bg-black/30 px-4 py-3 ${rank.row}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-wide ${rank.chip}`}
                  >
                    {rank.label}
                  </span>

                  <span className="truncate text-sm font-bold text-white">
                    <span aria-hidden="true">{genreEmoji(genre.name)}</span>{" "}
                    {genre.name}
                  </span>
                </div>

                <span className="shrink-0 text-sm font-semibold text-zinc-300">
                  {genre.count} {genre.count === 1 ? "vista" : "vistas"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {state.line && (
        <div className="flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-amber-700 via-orange-600 to-orange-500 px-6 py-4 text-center shadow-[0_6px_18px_rgba(251,146,60,0.35)] sm:px-8 sm:py-5">
          <span aria-hidden="true" className="text-2xl sm:text-3xl">
            🔥
          </span>
          <p className="text-base font-extrabold text-white sm:text-lg">
            {state.line}
          </p>
        </div>
      )}

      <button
        onClick={() => setSharing(true)}
        className="mx-auto rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Compartir
      </button>

      {picking && (
        <FavoritePickerDialog
          onPick={pickFavorite}
          onClose={() => setPicking(false)}
        />
      )}

      {savingFavorite && (
        <p className="text-center text-xs text-zinc-400">Guardando…</p>
      )}

      {sharing && (
        <ShareSummaryDialog
          onClose={() => setSharing(false)}
          options={{
            siteName: SITE_NAME,
            siteUrl: SITE_URL,
            headline: stats.headline,
            monthLabel: stats.monthLabel,
            last14: stats.last14,
            lastWatched: stats.lastWatched
              ? {
                  title: stats.lastWatched.title,
                  posterUrl: state.posters.lastWatched,
                  rating: stats.lastWatched.rating,
                }
              : undefined,
            bestRated: stats.bestRated
              ? {
                  title: stats.bestRated.title,
                  posterUrl: state.posters.bestRated,
                  rating: stats.bestRated.rating,
                }
              : undefined,
            favorite: titles.favorite
              ? {
                  title: titles.favorite.data.title,
                  posterUrl: state.posters.favorite,
                  rating: titles.favorite.data.rating,
                }
              : undefined,
            topGenre: stats.topGenre,
            leastGenre: stats.leastGenre,
            topGenres: stats.topGenres,
            totalWatched: stats.totalWatched,
            monthCount: stats.monthCount,
            isPersonalRecordMonth: stats.isPersonalRecordMonth,
            monthBadge: stats.monthBadge,
            monthDiff: stats.monthDiff,
            previousMonthCount: stats.previousMonthCount,
            previousMonthLabel: stats.previousMonthLabel,
            streakDays: stats.streakDays,
            averageRating: stats.averageRating,
            pendingCount: watchlist.count,
            rejectedCount,
            competitiveLine: state.line,
          }}
        />
      )}
    </div>
  );
}
