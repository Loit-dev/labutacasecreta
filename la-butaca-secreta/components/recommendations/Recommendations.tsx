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
import ShareDialog from "./ShareDialog";
import { badgeFor } from "./badges";

import { useRecommendations } from "@/hooks/useRecommendations";
import { useWatchlist } from "@/hooks/useWatchlist";
import { track } from "@/lib/analytics";
import { UserProfile } from "@/lib/conversation/types";
import { formatNames } from "@/lib/group";
import { posterSource, type ShareItem } from "@/lib/share";
import type { Recommendation } from "@/lib/tmdb/mapper";

type Props = {
  profile: UserProfile;
  // Si son para varias personas, el modo acompañado dice quiénes y cuánto
  // han coincidido
  group?: { names: string[]; percent: number };
};

export default function Recommendations({
  profile,
  group,
}: Props) {
  const audience = group ? formatNames(group.names) : undefined;

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

  const [shareItems, setShareItems] = useState<
    ShareItem[] | null
  >(null);

  // Texto para lectores de pantalla (avisa de lo que cambia)
  const [announcement, setAnnouncement] = useState("");

  const type = profile.contentType ?? "movie";

  const watchlist = useWatchlist();

  // Guarda o quita de «Mi lista» y lo anuncia
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

    setAnnouncement(
      added
        ? `«${movie.title}» guardada en tu lista.`
        : `«${movie.title}» quitada de tu lista.`
    );
  };

  const sectionRef = useRef<HTMLElement>(null);
  const scrolledRef = useRef(false);

  const closeShare = useCallback(
    () => setShareItems(null),
    []
  );

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
    setAnnouncement("Aquí tienes otras recomendaciones.");
    next();
  };

  const openShare = () => {
    const items: ShareItem[] = visible
      .slice(0, 3)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        rating: movie.rating,
        role: movie.role,
        posterUrl: posterSource(movie.poster),
      }));

    track("share_open", { type, count: items.length });

    setShareItems(items);
  };

  // Al quitar una tarjeta, el botón pulsado desaparece: el foco se
  // lleva a la sección y se avisa de lo ocurrido.
  const removed = (title: string) => {
    setAnnouncement(
      `«${title}» quitada de la lista. Te propongo otra.`
    );

    sectionRef.current?.focus();
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
        <p role="alert" className="text-red-400">
          No se pudieron cargar las recomendaciones.
        </p>

        {errorDetail && (
          <p className="break-words text-xs text-zinc-400">
            Detalle técnico: {errorDetail}
          </p>
        )}

        <button
          onClick={retry}
          className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs shadow-lg md:rounded-xl md:px-5 md:py-3 md:text-sm shadow-black/60 text-sm font-medium text-white transition-all hover:border-red-500/50 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
          className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white md:rounded-xl md:px-5 md:py-3 md:text-sm transition-all hover:border-red-500/50 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          🎬 Empezar de nuevo
        </button>

        {seenCount > 0 && (
          <div>
            <button
              onClick={forgetSeen}
              className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
    index: number,
    // Solo en el carrusel del móvil (una tarjeta a la vez)
    dots?: { total: number; current: number }
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
        dots={dots}
        saved={watchlist.has(movie.id, type)}
        onToggleSave={() => toggleSaved(movie)}
        onDetails={() => {
          track("details_open", {
            id: movie.id,
            role: movie.role,
          });

          setDetailsId(movie.id);
        }}
        onSeen={() => {
          markSeen(movie);
          removed(movie.title);
        }}
        onReject={() => {
          reject(movie);
          removed(movie.title);
        }}
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
      aria-labelledby="recommendations-title"
      tabIndex={-1}
      className="scroll-mt-4 scroll-mb-4 space-y-3 outline-none md:space-y-8"
    >
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="text-center">
        <h2
          id="recommendations-title"
          className="text-base font-bold text-white md:text-3xl"
        >
          <span aria-hidden="true">🎬</span> Creo que estas
          tres pueden ser justo lo que buscas.
        </h2>

        <p className="mt-1 text-xs text-zinc-400 md:mt-3 md:text-base">
          {audience
            ? "Seleccionadas especialmente para vosotros."
            : "Seleccionadas especialmente para ti."}
        </p>
      </div>

      {/* MOBILE */}
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label="Recomendaciones"
        className="md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <p className="sr-only" aria-live="polite">
          {visible[current]
            ? `Recomendación ${current + 1} de ${visible.length}: ${visible[current].title}`
            : ""}
        </p>

        {visible[current] && (
          <div
            key={visible[current].id}
            className="animate-fade-in relative"
          >
            {renderCard(visible[current], current, {
              total: visible.length,
              current,
            })}

            <button
              onClick={prevMovie}
              aria-label="Anterior"
              className="absolute left-2 top-[8.25rem] z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/65 text-3xl font-bold text-white shadow-xl shadow-black/60 backdrop-blur transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span aria-hidden="true">←</span>
            </button>

            <button
              onClick={nextMovie}
              aria-label="Siguiente"
              className="absolute right-2 top-[8.25rem] z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/65 text-3xl font-bold text-white shadow-xl shadow-black/60 backdrop-blur transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

      </div>

      {/* DESKTOP */}
      <div className="hidden gap-6 md:grid md:grid-cols-2 xl:grid-cols-3">
        {visible.map((movie, index) => renderCard(movie, index))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:mt-6 md:gap-3">
        <button
          onClick={openShare}
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg md:rounded-xl md:px-5 md:py-3 md:text-sm shadow-black/60 transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">📤</span> Compartir mis
          sugerencias
        </button>

        {hasMore && (
          <button
            onClick={nextBatch}
            disabled={
              available <= visible.length &&
              loadingMore
            }
            className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white md:rounded-xl md:px-5 md:py-3 md:text-sm transition-all hover:border-red-500/50 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60"
          >
            <span aria-hidden="true">🔄</span> Dame otras 3
            recomendaciones
          </button>
        )}
      </div>

      {seenCount > 0 && (
        <p className="text-center text-xs text-zinc-400">
          Has marcado {seenCount}{" "}
          {seenCount === 1 ? "título" : "títulos"} como
          {seenCount === 1 ? " visto" : " vistos"} ·{" "}
          <button
            onClick={forgetSeen}
            className="underline underline-offset-2 hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Olvidar mis títulos vistos
          </button>
        </p>
      )}

      {shareItems && (
        <ShareDialog
          items={shareItems}
          kind={type}
          group={group}
          onClose={closeShare}
        />
      )}

      {detailsMovie && detailsBadge && (
        <DetailsModal
          movie={detailsMovie}
          badge={detailsBadge.badge}
          badgeTitle={detailsBadge.badgeTitle}
          saved={watchlist.has(detailsMovie.id, type)}
          onToggleSave={() => toggleSaved(detailsMovie)}
          onClose={closeDetails}
        />
      )}
    </section>
  );
}
