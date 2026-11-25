import Image from "next/image";
import Link from "next/link";

import ActorCreditsGrid from "@/components/actor/ActorCreditsGrid";
import { BoltIcon, MasksIcon } from "@/components/icons/Icons";
import type { ActorDetails } from "@/lib/tmdb/shared";

type Props = {
  director: ActorDetails;
};

/**
 * Cuerpo de la ficha de director ("Modo Director", /director/[id]):
 * foto, nombre y una rejilla con su filmografía como director. Mismo
 * componente de rejilla que la ficha de actor (ActorCreditsGrid),
 * porque comparten exactamente la misma forma de datos.
 */
export default function DirectorPageBody({ director }: Props) {
  return (
    <>
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:w-28">
          {director.photo ? (
            <Image
              src={director.photo}
              alt={director.name}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-zinc-500"
            >
              <MasksIcon size={32} />
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Modo Director
          </p>
          <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl">
            {director.name}
          </h1>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Su filmografía
        </h2>

        <ActorCreditsGrid credits={director.credits} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-800 pt-6">
        <Link
          href="/hoy"
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/60 transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <BoltIcon size={14} className="inline -translate-y-px" /> Prueba Butaca Exprés
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
