"use client";

import { useRouter } from "next/navigation";

import RecommendationCard from "@/components/recommendations/RecommendationCard";
import type { Recommendation } from "@/lib/tmdb/mapper";

type Props = {
  badge: string;
  badgeTitle: string;
  mediaType: "movie" | "tv";
  title: Recommendation;
};

/**
 * Tarjeta de "Mi Resumen" (última vista, mejor valorada, favorita):
 * mismo formato visual que las tarjetas del Recomendador/Butaca
 * Exprés (RecommendationCard), pero sin los botones de "Guardar" /
 * "Ya la vi" / "No me apetece" (no tienen sentido aquí) y "Ver
 * detalles" lleva directamente a la ficha del título.
 */
export default function SummaryTitleCard({
  badge,
  badgeTitle,
  mediaType,
  title,
}: Props) {
  const router = useRouter();

  return (
    <RecommendationCard
      badge={badge}
      badgeTitle={badgeTitle}
      title={title.title}
      year={title.year}
      rating={title.rating}
      runtime={title.runtime}
      genres={title.genres}
      overview={title.overview}
      poster={title.poster}
      providers={title.providers}
      onDetails={() =>
        router.push(
          `/${mediaType === "tv" ? "serie" : "pelicula"}/${title.id}`
        )
      }
    />
  );
}
