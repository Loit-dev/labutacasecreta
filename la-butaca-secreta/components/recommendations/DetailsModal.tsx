"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import type { Recommendation } from "@/lib/tmdb/mapper";

type Props = {
  movie: Recommendation;
  badge: string;
  badgeTitle: string;
  onClose: () => void;
};

export default function DetailsModal({
  movie,
  badge,
  badgeTitle,
  onClose,
}: Props) {
  const [showTrailer, setShowTrailer] =
    useState(false);

  const closeRef =
    useRef<HTMLButtonElement>(null);

  // Cerrar con Escape, bloquear el scroll del fondo y llevar el foco al modal
  useEffect(() => {
    const previousFocus =
      document.activeElement as HTMLElement | null;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );

      document.body.style.overflow =
        previousOverflow;

      previousFocus?.focus();
    };
  }, [onClose]);

  const trailerSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${movie.title} ${movie.year} tráiler`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:rounded-3xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
        >
          ✕
        </button>

        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:p-8">
          <div className="relative mx-auto aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-2xl bg-black sm:mx-0 sm:w-52">
            <Image
              src={movie.poster}
              alt={movie.title}
              fill
              unoptimized={movie.poster.endsWith(
                ".svg"
              )}
              className="object-cover"
              sizes="208px"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                {badge} {badgeTitle}
              </div>

              <h2
                id="details-title"
                className="mt-2 text-2xl font-bold text-white"
              >
                {movie.title}
              </h2>

              {movie.tagline && (
                <p className="mt-1 text-sm italic text-zinc-400">
                  {movie.tagline}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
              <span>⭐ {movie.rating}</span>

              {movie.runtime ? (
                <span>{movie.runtime} min</span>
              ) : null}

              {movie.year ? (
                <span>{movie.year}</span>
              ) : null}
            </div>

            {movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {movie.reason && (
              <p className="rounded-xl bg-yellow-400/10 p-3 text-sm italic leading-relaxed text-yellow-200">
                💡 {movie.reason}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6 px-5 pb-8 sm:px-8">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Sinopsis
            </h3>

            <p className="mt-2 leading-relaxed text-zinc-200">
              {movie.overview ||
                "TMDb todavía no tiene sinopsis en español para este título."}
            </p>
          </section>

          {(movie.director ||
            movie.cast.length > 0) && (
            <section className="grid gap-4 sm:grid-cols-2">
              {movie.director && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Dirección
                  </h3>

                  <p className="mt-2 text-zinc-200">
                    {movie.director}
                  </p>
                </div>
              )}

              {movie.cast.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Reparto
                  </h3>

                  <p className="mt-2 text-zinc-200">
                    {movie.cast.join(", ")}
                  </p>
                </div>
              )}
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Dónde verla en España
            </h3>

            {movie.providers.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {movie.providers.map(
                  (provider) => (
                    <div
                      key={provider.name}
                      className="flex items-center gap-2"
                    >
                      <Image
                        src={provider.logo}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-lg"
                      />

                      <span className="text-sm text-zinc-200">
                        {provider.name}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">
                No tengo datos de plataformas ahora
                mismo.
              </p>
            )}

            {movie.watchLink && (
              <a
                href={movie.watchLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-red-400 underline-offset-2 hover:underline"
              >
                Ver todas las plataformas →
              </a>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Tráiler
            </h3>

            {movie.trailerKey ? (
              showTrailer ? (
                <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1&rel=0`}
                    title={`Tráiler de ${movie.title}`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <button
                  onClick={() =>
                    setShowTrailer(true)
                  }
                  className="mt-3 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                >
                  ▶ Ver tráiler
                </button>
              )
            ) : (
              <a
                href={trailerSearch}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-red-400 underline-offset-2 hover:underline"
              >
                Buscar el tráiler en YouTube →
              </a>
            )}
          </section>

          <p className="border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            Datos de películas y series: TMDb.
            Disponibilidad en plataformas:
            JustWatch.
          </p>
        </div>
      </div>
    </div>
  );
}
