"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";

import BadgeIcon from "./BadgeIcon";

import {
  BookmarkIcon,
  BulbIcon,
  MasksIcon,
  SearchIcon,
  StarFilledIcon,
} from "@/components/icons/Icons";
import { useDialog } from "@/hooks/useDialog";
import { track } from "@/lib/analytics";
import type { Recommendation } from "@/lib/tmdb/mapper";

type Props = {
  movie: Recommendation;
  badge: string;
  badgeTitle: string;
  saved?: boolean;
  onToggleSave?: () => void;
  onClose: () => void;
};

export default function DetailsModal({
  movie,
  badge,
  badgeTitle,
  saved = false,
  onToggleSave,
  onClose,
}: Props) {
  const [showTrailer, setShowTrailer] =
    useState(false);

  // Foco, Tab, Escape y scroll del fondo (ver useDialog)
  const dialogRef = useDialog<HTMLDivElement>(onClose);

  const trailerSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${movie.title} ${movie.year} tráiler`
  )}`;

  const castMembers = movie.castMembers ?? [];

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          showTrailer
            ? `Tráiler de ${movie.title}`
            : `Detalles de ${movie.title}`
        }
        tabIndex={-1}
        className="relative max-h-[96dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">✕</span>
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
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
                <div className="marquee-font text-sm text-yellow-400">
                  <span className="inline-flex -translate-y-px items-center">
                    <BadgeIcon badge={badge} size={14} className="text-yellow-400" />
                  </span>{" "}
                  {badgeTitle}
                </div>

                <h2
                  className="text-xl font-bold leading-tight text-white sm:text-2xl"
                >
                  {movie.title}
                </h2>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-300">
                  <span className="inline-flex items-center gap-1">
                    <StarFilledIcon size={13} className="text-amber-300" />
                    <span className="sr-only">Nota </span>
                    {movie.rating}
                  </span>

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

            {movie.director && (
              <p className="text-xs leading-relaxed text-zinc-400">
                <span className="text-zinc-400">Dirige:</span>{" "}
                {movie.director}
              </p>
            )}

            {castMembers.length > 0 && (
              <div>
                <h3 className="marquee-font text-sm text-zinc-400">
                  Reparto
                </h3>

                <ul className="mt-2 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {castMembers.map((actor) => (
                    <li
                      key={actor.id}
                      className="flex w-14 shrink-0 flex-col items-center gap-1 text-center"
                    >
                      <Link
                        href={`/actor/${actor.id}`}
                        className="flex w-full flex-col items-center gap-1 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                          {actor.photo ? (
                            <Image
                              src={actor.photo}
                              alt={actor.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex h-full w-full items-center justify-center text-zinc-500"
                            >
                              <MasksIcon size={22} />
                            </span>
                          )}
                        </div>

                        <span className="w-full truncate text-[10px] font-semibold text-zinc-200">
                          {actor.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {movie.reason && (
              <p className="rounded-xl bg-yellow-400/10 px-3 py-2 text-xs italic leading-relaxed text-yellow-200">
                <BulbIcon size={13} className="inline -translate-y-px" />{" "}
                {movie.reason}
              </p>
            )}

            {/* Plataformas */}
            <div>
              <h3 className="marquee-font text-sm text-zinc-400">
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
              {onToggleSave && (
                <button
                  onClick={onToggleSave}
                  aria-pressed={saved}
                  aria-label={
                    saved
                      ? `Guardada, quitar de mi lista: ${movie.title}`
                      : `Guardar en mi lista: ${movie.title}`
                  }
                  className={`marquee-font rounded-xl border px-4 py-2.5 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    saved
                      ? "border-yellow-500/70 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20"
                      : "border-zinc-600 text-white hover:bg-zinc-800"
                  }`}
                >
                  <span className="inline-flex -translate-y-px items-center">
                    {saved ? (
                      <span aria-hidden="true">✓</span>
                    ) : (
                      <BookmarkIcon size={14} />
                    )}
                  </span>{" "}
                  {saved ? "Guardada" : "Guardar"}
                </button>
              )}

              {movie.trailerKey ? (
                <button
                  onClick={() => {
                    track("trailer_open", { id: movie.id });

                    setShowTrailer(true);
                  }}
                  className="marquee-font rounded-xl bg-red-600 px-4 py-2.5 text-base text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true">▶</span> Ver tráiler
                </button>
              ) : (
                <a
                  href={trailerSearch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="marquee-font rounded-xl bg-red-600 px-4 py-2.5 text-base text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="inline-flex -translate-y-px items-center">
                    <SearchIcon />
                  </span>{" "}
                  Buscar tráiler
                  <span className="sr-only">
                    {" "}
                    (se abre en una pestaña nueva)
                  </span>
                </a>
              )}

            </div>

            <p className="text-[11px] text-zinc-400">
              Datos: TMDb · Plataformas: JustWatch
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
