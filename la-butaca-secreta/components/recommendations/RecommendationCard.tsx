import Image from "next/image";

type Props = {
  badge: string;
  badgeTitle: string;
  title: string;
  year: number;
  rating: number;
  runtime?: number;
  genres?: string[];
  overview: string;
  poster: string;
  providers?: {name: string; logo: string;}[];
  reason?: string;
  onDetails?: () => void;
  onSeen?: () => void;
  onReject?: () => void;
};

export default function RecommendationCard({
  badge,
  badgeTitle,
  title,
  year,
  rating,
  runtime,
  genres = [],
  overview,
  poster,
  providers = [],
  reason,
  onDetails,
  onSeen,
  onReject,
}: Props) {
  return (
    <article
      aria-label={title}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl"
    >
       <div className="relative h-58 w-full overflow-hidden">
        <Image src={poster} alt={title} fill unoptimized={poster.endsWith(".svg")} className="object-contain bg-black" sizes="(max-width: 768px) 100vw, 33vw" />
        {providers.length > 0 && (
  <div
    className="
      absolute
      bottom-3
      left-3
      flex
      items-center
      gap-2

      rounded-full

      bg-black/60

      px-3
      py-2

      backdrop-blur-md
      shadow-lg
    "
  >
    {providers.slice(0, 3).map((provider) => (
      <Image
        key={provider.name}
        src={provider.logo}
        alt={provider.name}
        width={26}
        height={26}
        className="rounded-full"
      />
    ))}
  </div>
)}
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            <span aria-hidden="true">{badge}</span>{" "}
            {badgeTitle}
          </div>

          <h2 className="mt-2 line-clamp-2 text-lg font-bold text-white">
            {title}
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
          <span>
            <span aria-hidden="true">⭐</span>
            <span className="sr-only">Nota </span>{" "}
            {rating}
          </span>

          {runtime ? (
            <span>{runtime} min</span>
          ) : null}

          <span>{year}</span>
        </div>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {reason && (
          <p className="text-xs italic leading-relaxed text-yellow-200/80">
            <span aria-hidden="true">💡</span> {reason}
          </p>
        )}

        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-300">
          {overview}
        </p>

        <button
  onClick={onDetails}
  aria-label={`Ver detalles de ${title}`}
  className="
    mt-auto
    w-full
    rounded-xl
    bg-red-600
    px-4
    py-3
    text-sm
    font-semibold
    text-white
    transition-colors
    hover:bg-red-500
    focus-visible:outline-2
    focus-visible:outline-offset-2
    focus-visible:outline-white
  "
>
  Ver detalles
</button>

        {(onSeen || onReject) && (
          <div className="flex gap-2">
            {onSeen && (
              <button
                onClick={onSeen}
                aria-label={`Ya la vi: ${title}`}
                title="No volveré a recomendártela"
                className="flex-1 rounded-lg border border-zinc-700 px-2 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span aria-hidden="true">👁</span> Ya la vi
              </button>
            )}

            {onReject && (
              <button
                onClick={onReject}
                aria-label={`No me apetece: ${title}`}
                title="Buscaré algo distinto"
                className="flex-1 rounded-lg border border-zinc-700 px-2 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span aria-hidden="true">👎</span> No me apetece
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}