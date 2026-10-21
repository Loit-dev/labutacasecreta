"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import DetailsModal from "./DetailsModal";
import RecommendationCard from "./RecommendationCard";
import RecommendationSkeleton from "./RecommendationSkeleton";

import { useRecommendations } from "@/hooks/useRecommendations";
import { UserProfile } from "@/lib/conversation/types";
import type { Recommendation } from "@/lib/tmdb/mapper";

type Props = {
  profile: UserProfile;
};

type Badge = {
  badge: string;
  badgeTitle: string;
};

const GOLD: Badge = {
  badge: "🥇",
  badgeTitle: "Mi apuesta para ti",
};

const SILVER: Badge = {
  badge: "🥈",
  badgeTitle: "Otra que creo que disfrutarás",
};

const BRONZE: Badge = {
  badge: "🥉",
  badgeTitle: "Una sorpresa que merece una oportunidad",
};

const EXTRA: Badge = {
  badge: "🎬",
  badgeTitle: "Otra que puede gustarte",
};

// La insignia depende del tipo de recomendación, no de la posición:
// así la sorpresa siempre es 🥉 aunque se descarte otra tarjeta.
function badgeFor(
  item: Recommendation,
  index: number,
  list: Recommendation[]
): Badge {
  if (item.role === "surprise") {
    return BRONZE;
  }

  const mainsBefore = list
    .slice(0, index)
    .filter((other) => other.role !== "surprise")
    .length;

  return [GOLD, SILVER][mainsBefore] ?? EXTRA;
}

export default function Recommendations({
  profile,
}: Props) {
  const {
    visible,
    available,
    phase,
    loadingMore,
    exhausted,
    errorDetail,
    seenCount,
    next,
    markSeen,
    reject,
    forgetSeen,
    retry,
  } = useRecommendations(profile);

  const [activeIndex, setActiveIndex] = useState(0);

  const [detailsId, setDetailsId] = useState<
    number | null
  >(null);

  const [touchStart, setTouchStart] = useState<
    number | null
  >(null);

  const [touchEnd, setTouchEnd] = useState<
    number | null
  >(null);

  const sectionRef = useRef<HTMLElement>(null);
  const scrolledRef = useRef(false);

  // Estable: la ventana de detalles lo usa en un efecto
  const closeDetails = useCallback(
    () => setDetailsId(null),
    []
  );

  // En el móvil se ve una tarjeta cada vez
  const current = Math.min(
    activeIndex,
    Math.max(visible.length - 1, 0)
  );

  const detailsMovie =
    visible.find((item) => item.id === detailsId) ??
    null;

  const nextMovie = () => {
    setActiveIndex(
      current >= visible.length - 1
        ? 0
        : current + 1
    );
  };

  const prevMovie = () => {
    setActiveIndex(
      current <= 0
        ? visible.length - 1
        : current - 1
    );
  };

  const nextBatch = () => {
    setActiveIndex(0);
    setDetailsId(null);
    next();
  };

  const minSwipeDistance = 50;

  const handleTouchStart = (
    e: React.TouchEvent
  ) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (
    e: React.TouchEvent
  ) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) {
      return;
    }

    const distance = touchStart - touchEnd;

    if (distance > minSwipeDistance) {
      nextMovie();
    }

    if (distance < -minSwipeDistance) {
      prevMovie();
    }
  };

  // Al aparecer las primeras recomendaciones, bajamos hasta ellas para
  // que se vean sin hacer scroll. Si caben en pantalla se alinean por
  // abajo; si son más altas, se muestran desde el principio.
  useEffect(() => {
    if (
      phase !== "ready" ||
      visible.length === 0 ||
      scrolledRef.current
    ) {
      return;
    }

    scrolledRef.current = true;

    // Pequeña espera para que el diseño termine de colocarse
    const timer = window.setTimeout(() => {
      const section = sectionRef.current;

      if (!section) return;

      const fits =
        section.getBoundingClientRect().height <=
        window.innerHeight - 32;

      section.scrollIntoView({
        behavior: "smooth",
        block: fits ? "end" : "start",
      });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [phase, visible.length]);

  // ----------------------------------------------
  // Estados
  // ----------------------------------------------

  if (phase === "loading") {
    return <RecommendationSkeleton />;
  }

  if (phase === "error") {
    return (
      <div className="space-y-3 text-center">
        <p className="text-red-400">
          No se pudieron cargar las recomendaciones.
        </p>

        {errorDetail && (
          <p className="break-words text-xs text-zinc-500">
            Detalle técnico: {errorDetail}
          </p>
        )}

        <button
          onClick={retry}
          className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-sm font-medium text-white transition-all hover:border-red-500/50 hover:bg-zinc-800"
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  if (visible.length === 0) {
    // Esperando a que lleguen más
    if (loadingMore && !exhausted) {
      return <RecommendationSkeleton compact />;
    }

    return (
      <div className="space-y-4 text-center">
        <p className="text-zinc-300">
          😕 Ya te he enseñado todo lo que encaja con lo
          que me has contado. Si quieres, empezamos de
          nuevo con otras respuestas.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-sm font-medium text-white transition-all hover:border-red-500/50 hover:bg-zinc-800"
        >
          🎬 Empezar de nuevo
        </button>

        {seenCount > 0 && (
          <div>
            <button
              onClick={forgetSeen}
              className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
            >
              Olvidar mis títulos vistos ({seenCount})
            </button>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------
  // Tarjetas
  // ----------------------------------------------

  const renderCard = (
    movie: Recommendation,
    index: number
  ) => {
    const { badge, badgeTitle } = badgeFor(
      movie,
      index,
      visible
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
        reason={movie.reason}
        onDetails={() => setDetailsId(movie.id)}
        onSeen={() => markSeen(movie)}
        onReject={() => reject(movie)}
      />
    );
  };

  const hasMore =
    available > visible.length ||
    loadingMore ||
    !exhausted;

  const detailsBadge = detailsMovie
    ? badgeFor(
        detailsMovie,
        visible.indexOf(detailsMovie),
        visible
      )
    : null;

  return (
    <section
      ref={sectionRef}
      id="recommendations"
      className="scroll-mt-4 scroll-mb-4 space-y-8"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          🎬 Creo que estas tres pueden ser justo lo que buscas.
        </h1>

        <p className="mt-3 text-sm text-zinc-400 md:text-base">
          Seleccionadas especialmente para ti.
        </p>
      </div>

      {/* MOBILE */}
      <div
        className="md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {visible[current] && (
          <div
            key={visible[current].id}
            className="animate-fade-in relative"
          >
            {renderCard(visible[current], current)}

            <button
              onClick={prevMovie}
              aria-label="Anterior"
              className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur"
            >
              ←
            </button>

            <button
              onClick={nextMovie}
              aria-label="Siguiente"
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur"
            >
              →
            </button>
          </div>
        )}

        {visible.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {visible.map((movie, index) => (
              <div
                key={movie.id}
                className={
                  index === current
                    ? "h-2 w-6 rounded-full bg-red-500 transition-all duration-300"
                    : "h-2 w-2 rounded-full bg-zinc-600 transition-all duration-300"
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden gap-6 md:grid md:grid-cols-2 xl:grid-cols-3">
        {visible.map(renderCard)}
      </div>

      {hasMore && (
        <button
          onClick={nextBatch}
          disabled={
            available <= visible.length &&
            loadingMore
          }
          className="
            mx-auto
            mt-6
            block

            rounded-xl
            border
            border-zinc-700

            bg-zinc-900/80

            px-5
            py-3

            text-sm
            font-medium
            text-white

            transition-all

            hover:border-red-500/50
            hover:bg-zinc-800

            disabled:cursor-wait
            disabled:opacity-60
          "
        >
          🔄 Dame otras 3 recomendaciones
        </button>
      )}

      {seenCount > 0 && (
        <p className="text-center text-xs text-zinc-500">
          Has marcado {seenCount}{" "}
          {seenCount === 1 ? "título" : "títulos"} como
          {seenCount === 1 ? " visto" : " vistos"} ·{" "}
          <button
            onClick={forgetSeen}
            className="underline underline-offset-2 hover:text-zinc-300"
          >
            Olvidar mis títulos vistos
          </button>
        </p>
      )}

      {detailsMovie && detailsBadge && (
        <DetailsModal
          movie={detailsMovie}
          badge={detailsBadge.badge}
          badgeTitle={detailsBadge.badgeTitle}
          onClose={closeDetails}
        />
      )}
    </section>
  );
}
