"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import DetailsModal from "./DetailsModal";
import RecommendationCard from "./RecommendationCard";
import { badgeFor } from "./badges";

import { useWatchlist } from "@/hooks/useWatchlist";
import { track } from "@/lib/analytics";
import type { Recommendation } from "@/lib/tmdb/mapper";

type Props = {
  items: Recommendation[];
  type: "movie" | "tv";
};

/**
 * Las recomendaciones de un enlace compartido: se pueden ver los
 * detalles y guardar en «Mi lista», pero sin descartar nada.
 */
export default function SharedRecommendations({
  items,
  type,
}: Props) {
  const watchlist = useWatchlist();

  const [detailsId, setDetailsId] = useState<number | null>(null);

  const closeDetails = useCallback(() => setDetailsId(null), []);

  useEffect(() => {
    track("share_link_open", { type, count: items.length });
  }, [type, items.length]);

  const toggleSaved = (movie: Recommendation) => {
    const added = watchlist.toggle({
      id: movie.id,
      type,
      title: movie.title,
      year: movie.year || undefined,
      rating: movie.rating,
      poster: movie.poster,
      platforms: (movie.platforms ?? []).map(
        (platform) => platform.name
      ),
    });

    track(added ? "list_add" : "list_remove", {
      type,
      id: movie.id,
      role: movie.role,
    });
  };

  const detailsMovie =
    items.find((item) => item.id === detailsId) ?? null;

  return (
    <>
      <div
        className={`grid gap-6 ${
          items.length === 1
            ? "mx-auto max-w-sm"
            : items.length === 2
              ? "mx-auto max-w-2xl md:grid-cols-2"
              : "md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {items.map((movie, index) => {
          const { badge, badgeTitle } = badgeFor(
            movie,
            index,
            items,
            true
          );

          return (
            <RecommendationCard
              key={movie.id}
              badge={badge}
              badgeTitle={badgeTitle}
              title={movie.title}
              year={movie.year}
              rating={movie.rating}
              runtime={movie.runtime}
              genres={movie.genres}
              overview={movie.overview}
              poster={movie.poster}
              providers={movie.providers}
              saved={watchlist.has(movie.id, type)}
              onToggleSave={() => toggleSaved(movie)}
              onDetails={() => setDetailsId(movie.id)}
            />
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="inline-block rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">🎬</span> Quiero las mías: hacer
          el cuestionario
        </Link>
      </div>

      {detailsMovie && (
        <DetailsModal
          movie={detailsMovie}
          badge={
            badgeFor(
              detailsMovie,
              items.indexOf(detailsMovie),
              items,
              true
            ).badge
          }
          badgeTitle={
            badgeFor(
              detailsMovie,
              items.indexOf(detailsMovie),
              items,
              true
            ).badgeTitle
          }
          saved={watchlist.has(detailsMovie.id, type)}
          onToggleSave={() => toggleSaved(detailsMovie)}
          onClose={closeDetails}
        />
      )}
    </>
  );
}
