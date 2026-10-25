"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { track } from "@/lib/analytics";
import { posterSource } from "@/lib/share";
import { fetchMonthRank, fetchWatchedHistory } from "@/lib/supabase/summary";
import {
  buildSummary,
  competitiveLine,
  type SummaryStats,
} from "@/lib/summary";
import { SITE_NAME, SITE_URL } from "@/lib/site";

import ShareSummaryDialog from "./ShareSummaryDialog";

type Poster = { lastWatched?: string; bestRated?: string };

type State =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; stats: SummaryStats; line?: string; posters: Poster };

async function fetchPoster(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<string | undefined> {
  try {
    const response = await fetch(
      `/api/resumen-poster?type=${mediaType}&id=${tmdbId}`
    );

    if (!response.ok) return undefined;

    const data = (await response.json()) as { poster?: string | null };

    return posterSource(data.poster ?? undefined);
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

function TitleCard({
  label,
  title,
  rating,
  poster,
}: {
  label: string;
  title?: string;
  rating?: number;
  poster?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-white/10 bg-black/30 p-3">
      <span className="text-[11px] font-bold tracking-wide text-orange-400">
        {label}
      </span>

      {title ? (
        <div className="flex items-center gap-3">
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              className="h-20 w-14 shrink-0 rounded-lg object-cover"
            />
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {title}
            </p>

            {rating && (
              <p className="text-sm text-amber-300">★ {rating}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Aún sin datos</p>
      )}
    </div>
  );
}

export default function MiResumenScreen() {
  const { session, loading, available } = useAuth();

  const [state, setState] = useState<State>({ status: "loading" });

  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    setState({ status: "loading" });

    (async () => {
      const [rows, rank] = await Promise.all([
        fetchWatchedHistory(session.user.id),
        fetchMonthRank(),
      ]);

      if (cancelled) return;

      if (rows.length === 0) {
        setState({ status: "empty" });
        track("summary_no_data");
        return;
      }

      const stats = buildSummary(rows);

      const line = rank
        ? competitiveLine(rank.percentile, rank.totalUsers, rank.mine)
        : undefined;

      const posters: Poster = {};

      await Promise.all([
        stats.lastWatched
          ? fetchPoster(
              stats.lastWatched.tmdbId,
              stats.lastWatched.mediaType
            ).then((p) => (posters.lastWatched = p))
          : Promise.resolve(),
        stats.bestRated
          ? fetchPoster(
              stats.bestRated.tmdbId,
              stats.bestRated.mediaType
            ).then((p) => (posters.bestRated = p))
          : Promise.resolve(),
      ]);

      if (cancelled) return;

      setState({ status: "ready", stats, line, posters });

      track("summary_open");
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

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

  const { stats } = state;

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

      <div className={`${CARD} flex flex-col gap-3 p-4 sm:flex-row`}>
        <TitleCard
          label="ÚLTIMA VISTA"
          title={stats.lastWatched?.title}
          poster={state.posters.lastWatched}
        />

        <TitleCard
          label="MEJOR VALORADA"
          title={stats.bestRated?.title}
          rating={stats.bestRated?.rating}
          poster={state.posters.bestRated}
        />
      </div>

      {(stats.topGenre || stats.leastGenre) && (
        <div className={`${CARD} flex gap-4 p-4`}>
          {stats.topGenre && (
            <div className="flex-1">
              <p className="text-[11px] font-bold tracking-wide text-zinc-400">
                GÉNERO FAVORITO
              </p>
              <p className="text-lg font-black text-white">
                {stats.topGenre.name}
              </p>
            </div>
          )}

          {stats.leastGenre && (
            <div className="flex-1 text-right">
              <p className="text-[11px] font-bold tracking-wide text-zinc-400">
                EL QUE MENOS VES
              </p>
              <p className="text-lg font-black text-white">
                {stats.leastGenre.name}
              </p>
            </div>
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
