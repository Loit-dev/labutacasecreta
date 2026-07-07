import Image from "next/image";

type Props = {
  badge: string;
  badgeTitle: string;
  title: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
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
  genres,
  overview,
  poster,
}: Props) {
  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl">

      <div className="relative aspect-[2/3] w-full">
        <Image
          src={poster}
          alt={title}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="space-y-4 p-6">

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
            {badge} {badgeTitle}
          </div>

          <h2 className="mt-2 text-3xl font-bold text-white">
            {title}
          </h2>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
          <span>⭐ {rating}</span>
          <span>{runtime} min</span>
          <span>{year}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
            >
              {genre}
            </span>
          ))}
        </div>

        <p className="leading-relaxed text-zinc-300">
          {overview}
        </p>

      </div>
    </article>
  );
}