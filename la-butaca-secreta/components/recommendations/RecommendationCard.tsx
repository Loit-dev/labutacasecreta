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
}: Props) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl">
       <div className="relative aspect-[2/2.4] w-full">
        <Image
  src={poster}
  alt={title}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 33vw"
/>
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            {badge} {badgeTitle}
          </div>

          <h2 className="mt-2 line-clamp-2 text-lg font-bold text-white">
            {title}
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
          <span>⭐ {rating}</span>

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

        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-300">
          {overview}
        </p>

        <button
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
  "
>
  Ver detalles
</button>
      </div>
    </article>
  );
}