"use client";

import { StarFilledIcon } from "@/components/icons/Icons";

type Props = {
  onClick: () => void;
};

/**
 * Tarjeta vacía ("+") de "Mi Resumen", del mismo tamaño que
 * RecommendationCard, para que las 3 tarjetas (última vista,
 * favorita, mejor valorada) queden alineadas en el grid.
 */
export default function FavoriteCard({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Elegir tu película o serie favorita"
      className="flex h-full w-full flex-col overflow-hidden rounded-3xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 shadow-xl transition-colors hover:border-yellow-500/60 hover:bg-zinc-900/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <div className="flex h-28 w-full flex-col items-center justify-center gap-1 sm:h-36 md:h-40">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-zinc-600 text-lg font-light text-zinc-400"
        >
          +
        </span>

        <span className="px-1 text-center text-[10px] font-semibold text-zinc-300">
          Elige favorita
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center p-2 text-center">
        <div className="flex justify-center text-yellow-400">
          <StarFilledIcon size={12} />
        </div>

        <p className="mt-1 text-[10px] text-zinc-400">
          Búscala y márcala
        </p>
      </div>
    </button>
  );
}
