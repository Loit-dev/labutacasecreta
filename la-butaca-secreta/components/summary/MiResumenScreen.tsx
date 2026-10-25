"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { track } from "@/lib/analytics";
import { genreEmoji } from "@/lib/genreEmoji";
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

type Poster = { lastWatched?: string; bestRated?: string };

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
      className="flex h-24 items-end gap-1.5"
      role="img"
      aria-label={`Vistas de los últimos 14 días: ${last14
        .map((d) => d.count)
        .join(", ")}`}
    >
      {last14.map((d) => (
        <div
          key={d.date}
          className="flex-1 rounded-t-md bg-gradient-to-t from-orange-600 to-amber-400"
          style={{
            height: `${Math.max(6, (d.count / max) * 100)}%`,
          }}
          title={`${d.date}: ${d.count}`}
        />
      ))}
    </div>
  );
}

function GenreBox({
  label,
  name,
  align,
}: {
  label: string;
  name: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`${CARD} flex-1 p-4 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <p className="text-[11px] font-bold tracking-wide text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">
        <span aria-hidden="true">{genreEmoji(name)}</span> {name}
      </p>
    </div>
  );
}

export default function MiResumenScreen() {
  const { session, loading, available } = useAuth();

  const [state, setState] = useState<State>({ status: "loading" });

  const [sharing, setSharing] = useState(false);

  const [picking, setPicking] = useState(false);

  const [savingFavorite, setSavingFavorite] = useState(false);

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
        <h1
          className="text-2xl font-black text-white"
          style={{ fontFamily: "var(--font-manrope)" }}
        >
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

      {(stats.topGenre || stats.leastGenre) && (
        <div className="flex gap-4">
          {stats.topGenre && (
            <GenreBox
              label="GÉNERO FAVORITO"
              name={stats.topGenre.name}
              align="left"
            />
          )}

          {stats.leastGenre && (
            <GenreBox
              label="EL QUE MENOS VES"
              name={stats.leastGenre.name}
              align="right"
            />
          )}
        </div>
      )}

      {state.line && (
        <p className="text-center text-sm font-semibold text-amber-300">
          {state.line}
        </p>
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
            topGenre: stats.topGenre,
            leastGenre: stats.leastGenre,
            competitiveLine: state.line,
          }}
        />
      )}
    </div>
  );
}
