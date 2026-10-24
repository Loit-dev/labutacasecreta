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
 *
 * En el móvil se ven como un carrusel que se desliza en horizontal
 * (una tarjeta ancha, deslizable con el dedo) en vez de una lista de
 * arriba a abajo; en el escritorio, en una rejilla como el resto de
 * la web. Todas las tarjetas están siempre en la página (solo cambia
 * cómo se colocan), así que no hace falta ningún botón ni estado para
 * «la tarjeta actual».
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
        role="region"
        aria-roledescription="carrusel"
        aria-label="Recomendaciones compartidas"
        className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:gap-6 md:overflow-visible md:pb-0 ${
          items.length === 1
            ? "md:mx-auto md:max-w-sm"
            : items.length === 2
              ? "md:mx-auto md:max-w-2xl md:grid-cols-2"
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
            <div
              key={movie.id}
              className="w-[82vw] max-w-sm shrink-0 snap-center md:w-auto md:max-w-none md:shrink"
            >
              <RecommendationCard
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
            </div>
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
