"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { ActorCredit } from "@/lib/tmdb/shared";

type Props = {
  credits: ActorCredit[];
};

type SortBy = "popularity" | "recent";

const SORTS: { id: SortBy; label: string }[] = [
  { id: "popularity", label: "Popularidad" },
  { id: "recent", label: "Más recientes" },
];

/**
 * Rejilla de la filmografía de un actor. Ya llega ordenada por
 * popularidad desde el servidor; aquí se puede reordenar por año sin
 * volver a pedir nada, porque ya tenemos todos los datos.
 */
export default function ActorCreditsGrid({ credits }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>("popularity");

  const sorted = useMemo(() => {
    if (sortBy === "recent") {
      return [...credits].sort(
        (a, b) => (b.year ?? 0) - (a.year ?? 0)
      );
    }

    return [...credits].sort(
      (a, b) => b.popularity - a.popularity
    );
  }, [credits, sortBy]);

  if (credits.length === 0) {
    return (
      <p className="mt-2 text-sm text-zinc-400">
        TMDb todavía no tiene su filmografía completa.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div
        role="group"
        aria-label="Ordenar por"
        className="flex gap-2"
      >
        {SORTS.map((sort) => (
          <button
            key={sort.id}
            type="button"
            onClick={() => setSortBy(sort.id)}
            aria-pressed={sortBy === sort.id}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              sortBy === sort.id
                ? "border-red-500/70 bg-red-500/10 text-white"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
            }`}
          >
            {sort.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {sorted.map((credit) => (
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
    </div>
  );
}
