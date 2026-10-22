import Image from "next/image";

import type { Recommendation } from "@/lib/tmdb/mapper";

type Props = {
  items: Recommendation[];
};

/**
 * Rejilla de títulos para las páginas SEO de género+plataforma.
 * A diferencia de RecommendationCard (pensada para el resultado del
 * cuestionario, con guardar/compartir/detalles), esta es de solo
 * lectura: no hay interacción de cliente, así la página entera puede
 * generarse estática.
 */
export default function CatalogGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
        >
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={item.poster}
              alt={item.title}
              fill
              unoptimized={item.poster.endsWith(".svg")}
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
          </div>

          <div className="p-2.5">
            <h3 className="line-clamp-2 text-sm font-semibold text-white">
              {item.title}
            </h3>

            <p className="mt-0.5 text-xs text-zinc-400">
              {item.year > 0 ? item.year : ""}
              {item.year > 0 && item.rating > 0 ? " · " : ""}
              {item.rating > 0 ? `⭐ ${item.rating}` : ""}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
