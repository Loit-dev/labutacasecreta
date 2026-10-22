import Image from "next/image";
import Link from "next/link";

import type { ActorDetails } from "@/lib/tmdb/shared";

type Props = {
  actor: ActorDetails;
};

/**
 * Cuerpo de la ficha de actor (/actor/[id]): foto, nombre y una
 * rejilla con su filmografía. Cada póster enlaza a la ficha propia de
 * esa película o serie, que es la que resuelve dónde verla.
 */
export default function ActorPageBody({ actor }: Props) {
  return (
    <>
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:w-28">
          {actor.photo ? (
            <Image
              src={actor.photo}
              alt={actor.name}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-3xl text-zinc-500"
            >
              🎭
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl">
          {actor.name}
        </h1>
      </div>

      <div className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Películas y series
        </h2>

        {actor.credits.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {actor.credits.map((credit) => (
              <Link
                key={`${credit.type}-${credit.id}`}
                href={`${credit.type === "tv" ? "/serie" : "/pelicula"}/${credit.id}`}
                className="block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <div className="relative aspect-[2/3] w-full bg-black">
                  {credit.poster && (
                    <Image
                      src={credit.poster}
                      alt={credit.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  )}
                </div>

                <div className="p-2.5">
                  <h3 className="line-clamp-2 text-sm font-semibold text-white">
                    {credit.title}
                  </h3>

                  <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">
                    {credit.year ? credit.year : ""}
                    {credit.year && credit.character ? " · " : ""}
                    {credit.character}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">
            TMDb todavía no tiene su filmografía completa.
          </p>
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
        Datos: TMDb
      </p>
    </>
  );
}
