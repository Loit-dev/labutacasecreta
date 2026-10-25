"use client";

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
      <div className="flex h-80 w-full flex-col items-center justify-center gap-2 md:h-58">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-zinc-600 text-3xl font-light text-zinc-400"
        >
          +
        </span>

        <span className="text-sm font-semibold text-zinc-300">
          Elige tu favorita
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center p-4 text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
          <span aria-hidden="true">⭐</span> TU FAVORITA
        </div>

        <p className="mt-2 text-sm text-zinc-400">
          Búscala y márcala para que aparezca aquí
        </p>
      </div>
    </button>
  );
}
