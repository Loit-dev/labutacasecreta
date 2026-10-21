"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

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

  const cast = movie.cast.slice(0, 3).join(", ");

  const platforms = movie.platforms ?? [];

  // Se pinta en <body> con un portal: el contenedor del chat tiene
  // backdrop-blur y overflow-hidden, lo que haría que "fixed" se
  // posicionara y recortara respecto a él y no respecto a la pantalla.
  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
        className="relative max-h-[96dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
        >
          ✕
        </button>

        {showTrailer && movie.trailerKey ? (
          <div className="space-y-3 pt-8">
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1&rel=0`}
                title={`Tráiler de ${movie.title}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>

            <button
              onClick={() => setShowTrailer(false)}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              ← Volver a los detalles
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Cabecera: póster + datos básicos */}
            <div className="flex gap-4 pr-10">
              <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl bg-black sm:w-28">
                <Image
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  unoptimized={movie.poster.endsWith(
                    ".svg"
                  )}
                  className="object-cover"
                  sizes="112px"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                  {badge} {badgeTitle}
                </div>

                <h2
                  id="details-title"
                  className="text-xl font-bold leading-tight text-white sm:text-2xl"
                >
                  {movie.title}
                </h2>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-300">
                  <span>⭐ {movie.rating}</span>

                  {movie.runtime ? (
                    <span>{movie.runtime} min</span>
                  ) : null}

                  {movie.year ? (
                    <span>{movie.year}</span>
                  ) : null}
                </div>

                {movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres
                      .slice(0, 3)
                      .map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                        >
                          {genre}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resumen */}
            <p className="line-clamp-3 text-sm leading-relaxed text-zinc-200 sm:line-clamp-4">
              {movie.overview ||
                "TMDb todavía no tiene sinopsis en español para este título."}
            </p>

            {(movie.director || cast) && (
              <p className="text-xs leading-relaxed text-zinc-400">
                {movie.director && (
                  <>
                    <span className="text-zinc-500">
                      Dirige:
                    </span>{" "}
                    {movie.director}
                  </>
                )}

                {movie.director && cast && " · "}

                {cast && (
                  <>
                    <span className="text-zinc-500">
                      Con:
                    </span>{" "}
                    {cast}
                  </>
                )}
              </p>
            )}

            {movie.reason && (
              <p className="rounded-xl bg-yellow-400/10 px-3 py-2 text-xs italic leading-relaxed text-yellow-200">
                💡 {movie.reason}
              </p>
            )}

            {/* Plataformas */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Disponible en
              </h3>

              {platforms.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <li
                      key={platform.name}
                      className="flex items-center gap-2 rounded-full bg-zinc-800 py-1 pl-1 pr-3"
                    >
                      <Image
                        src={platform.logo}
                        alt=""
                        width={24}
                        height={24}
                        className="rounded-full"
                      />

                      <span className="text-xs text-zinc-200">
                        {platform.name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-zinc-400">
                  No tengo datos de plataformas ahora
                  mismo.
                </p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center gap-3">
              {movie.trailerKey ? (
                <button
                  onClick={() =>
                    setShowTrailer(true)
                  }
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                >
                  ▶ Ver tráiler
                </button>
              ) : (
                <a
                  href={trailerSearch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                >
                  🔎 Buscar tráiler
                </a>
              )}

              {movie.watchLink && (
                <a
                  href={movie.watchLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-400 underline-offset-2 hover:text-white hover:underline"
                >
                  Ver más opciones →
                </a>
              )}
            </div>

            <p className="text-[11px] text-zinc-600">
              Datos: TMDb · Plataformas: JustWatch
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
