import Image from "next/image";
import Link from "next/link";

import TitleActions from "./TitleActions";

import { genreSlugForLabel, platformKeyForName } from "@/lib/catalog";
import type { Recommendation } from "@/lib/tmdb/mapper";

type Props = {
  type: "movie" | "tv";
  title: Recommendation;
};

/**
 * Cuerpo de la ficha de título (/pelicula/[id], /serie/[id]). Mismos
 * datos que DetailsModal (reparto, plataformas, tráiler...), pero en
 * una página propia e indexable en vez de un diálogo.
 */
export default function TitlePageBody({ type, title }: Props) {
  const castMembers = title.castMembers ?? [];

  const platforms = title.platforms ?? [];

  const trailerHref = title.trailerKey
    ? `https://www.youtube.com/watch?v=${title.trailerKey}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${title.title} ${title.year || ""} tráiler`
      )}`;

  // Enlace de vuelta a la página de catálogo que encaje (primer
  // género+plataforma que tengamos como combinación fija), para
  // cerrar el círculo entre ficha y catálogo.
  const basePath = type === "tv" ? "/series" : "/pelis";

  const catalogLink = title.genres
    .map((genre) => genreSlugForLabel(genre))
    .find((slug): slug is string => Boolean(slug));

  const catalogPlatform = platforms
    .map((platform) => platformKeyForName(platform.name))
    .find((key): key is NonNullable<typeof key> => Boolean(key));

  return (
    <>
      <div className="flex gap-4 sm:gap-5">
        <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-2xl bg-black sm:w-36">
          <Image
            src={title.poster}
            alt={title.title}
            fill
            unoptimized={title.poster.endsWith(".svg")}
            className="object-cover"
            sizes="144px"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl">
            {title.title}
          </h1>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-300">
            {title.rating > 0 && (
              <span>
                <span aria-hidden="true">⭐</span>
                <span className="sr-only">Nota </span> {title.rating}
              </span>
            )}

            {title.year > 0 && <span>{title.year}</span>}

            {title.runtime > 0 && <span>{title.runtime} min</span>}
          </div>

          {title.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {title.genres.map((genre) => (
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

      <p className="mt-5 text-sm leading-relaxed text-zinc-200 sm:text-base">
        {title.overview ||
          "TMDb todavía no tiene sinopsis en español para este título."}
      </p>

      {title.director && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          <span className="text-zinc-500">Dirige:</span>{" "}
          {title.director}
        </p>
      )}

      {castMembers.length > 0 && (
        <div className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Reparto
          </h2>

          <ul className="mt-2 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {castMembers.map((actor) => (
              <li
                key={actor.id}
                className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center sm:w-20"
              >
                <Link
                  href={`/actor/${actor.id}`}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:w-20">
                    {actor.photo ? (
                      <Image
                        src={actor.photo}
                        alt={actor.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-full w-full items-center justify-center text-xl text-zinc-500"
                      >
                        🎭
                      </span>
                    )}
                  </div>

                  <span className="w-full truncate text-[11px] font-semibold text-zinc-200">
                    {actor.name}
                  </span>

                  {actor.character && (
                    <span className="w-full truncate text-[10px] text-zinc-500">
                      {actor.character}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Disponible en
        </h2>

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
          <p className="mt-2 text-sm text-zinc-400">
            Ahora mismo no está en ninguna de las plataformas que
            sigo (Netflix, Prime Video, Disney+, Max o Filmin).
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <TitleActions type={type} title={title} />

        <a
          href={trailerHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">▶</span>{" "}
          {title.trailerKey ? "Ver tráiler" : "Buscar tráiler"}
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>

        {catalogLink && catalogPlatform && (
          <Link
            href={`${basePath}/${catalogLink}/${catalogPlatform}`}
            className="rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Más {type === "tv" ? "series" : "películas"} así
          </Link>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-800 pt-6">
        <Link
          href="/hoy"
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/60 transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">⚡</span> Prueba Butaca Exprés
        </Link>

        <Link
          href="/"
          className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Hacer el cuestionario completo
        </Link>
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-500">
        Datos: TMDb · Plataformas: JustWatch
      </p>
    </>
  );
}
