"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type TouchEvent,
} from "react";

import DetailsModal from "./DetailsModal";
import RecommendationCard from "./RecommendationCard";
import { badgeFor } from "./badges";

import { useWatchlist } from "@/hooks/useWatchlist";
import { track } from "@/lib/analytics";
import type { Recommendation } from "@/lib/tmdb/mapper";
import { ClapperIcon } from "@/components/icons/Icons";

type Props = {
  items: Recommendation[];
  type: "movie" | "tv";
};

/**
 * Las recomendaciones de un enlace compartido: se pueden ver los
 * detalles y guardar en «Mi lista», pero sin descartar nada.
 *
 * En el móvil se ven igual que en el resto de la web: una tarjeta
 * cada vez, con flechas y deslizando con el dedo (en vez de todas
 * apiladas de arriba a abajo); en el escritorio, en una rejilla.
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

  // En el móvil se ve una tarjeta cada vez, como en el resto de la
  // web (mismo patrón de carrusel con flechas y deslizar)
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const current = Math.min(activeIndex, Math.max(items.length - 1, 0));

  const nextMovie = () => {
    setActiveIndex(current >= items.length - 1 ? 0 : current + 1);
  };

  const prevMovie = () => {
    setActiveIndex(current <= 0 ? items.length - 1 : current - 1);
  };

  const minSwipeDistance = 50;

  const handleTouchStart = (event: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(event.targetTouches[0].clientX);
  };

  const handleTouchMove = (event: TouchEvent) => {
    setTouchEnd(event.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;

    if (distance > minSwipeDistance) nextMovie();
    if (distance < -minSwipeDistance) prevMovie();
  };

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

  const renderCard = (
    movie: Recommendation,
    index: number,
    dots?: { total: number; current: number }
  ) => {
    const { badge, badgeTitle } = badgeFor(movie, index, items, true);

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
        dots={dots}
        saved={watchlist.has(movie.id, type)}
        onToggleSave={() => toggleSaved(movie)}
        onDetails={() => setDetailsId(movie.id)}
      />
    );
  };

  const detailsMovie =
    items.find((item) => item.id === detailsId) ?? null;

  return (
    <>
      {/* MOBILE: una tarjeta cada vez, como en el resto de la web */}
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label="Recomendaciones compartidas"
        className="md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items[current] && (
          <div
            key={items[current].id}
            className="animate-fade-in relative"
          >
            {renderCard(items[current], current, {
              total: items.length,
              current,
            })}

            {items.length > 1 && (
              <>
                <button
                  onClick={prevMovie}
                  aria-label="Anterior"
                  className="absolute left-2 top-[8.25rem] z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/65 text-3xl font-bold text-white shadow-xl shadow-black/60 backdrop-blur-sm transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true">←</span>
                </button>

                <button
                  onClick={nextMovie}
                  aria-label="Siguiente"
                  className="absolute right-2 top-[8.25rem] z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/65 text-3xl font-bold text-white shadow-xl shadow-black/60 backdrop-blur-sm transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div
        className={`hidden gap-6 md:grid ${
          items.length === 1
            ? "mx-auto max-w-sm"
            : items.length === 2
              ? "mx-auto max-w-2xl md:grid-cols-2"
              : "md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {items.map((movie, index) => renderCard(movie, index))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="marquee-font inline-block rounded-xl bg-red-600 px-6 py-3 text-base text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ClapperIcon size={14} className="inline -translate-y-px" /> Quiero las mías: hacer
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
