import { UserProfile } from "@/lib/conversation/types";
import { MoodGenres } from "./genres";

export interface RecommendationFilters {
  type: "movie" | "tv";

  withGenres: number[];

  withoutGenres: number[];

  runtimeLte?: number;

  runtimeGte?: number;

  releaseAfter?: string;

  releaseBefore?: string;
}

export function buildFilters(
  profile: UserProfile
): RecommendationFilters {
  const filters: RecommendationFilters = {
    type: profile.contentType ?? "movie",

    withGenres: [],

    withoutGenres: [],
  };

  // ============================
  // Estado de ánimo
  // ============================

  if (profile.mood) {
    const mood =
      MoodGenres[
        profile.mood as keyof typeof MoodGenres
      ];

    if (mood) {
      filters.withGenres.push(...mood.genres);

      if (mood.excludedGenres) {
        filters.withoutGenres.push(
          ...mood.excludedGenres
        );
      }
    }
  }

  // ============================
  // Compañía
  // ============================

  switch (profile.company) {
    case "family":
      filters.withGenres.push(10751);
      filters.withoutGenres.push(27, 53);
      break;

    case "partner":
      filters.withGenres.push(10749);
      break;

    case "friends":
      filters.withGenres.push(35, 28);
      break;
  }

  // ============================
  // Animación
  // ============================

  if (profile.animation === "yes") {
    filters.withGenres.push(16);
  }

  if (profile.animation === "no") {
    filters.withoutGenres.push(16);
  }

  // ============================
  // Duración
  // ============================

  switch (profile.duration) {
    case "short":
      filters.runtimeLte = 90;
      break;

    case "normal":
      filters.runtimeGte = 90;
      filters.runtimeLte = 140;
      break;

    case "long":
      filters.runtimeGte = 140;
      break;
  }

  // ============================
  // Antigüedad
  // ============================

  switch (profile.freshness) {
    case "new":
      filters.releaseAfter = "2022-01-01";
      break;

    case "classic":
      filters.releaseBefore = "2005-12-31";
      break;
  }

  // ============================
  // Restricciones
  // ============================

  profile.restrictions?.forEach((restriction) => {
    switch (restriction) {
      case "terror":
        filters.withoutGenres.push(27);
        break;

      case "romance":
        filters.withoutGenres.push(10749);
        break;

      case "musical":
        filters.withoutGenres.push(10402);
        break;

      case "documentary":
        filters.withoutGenres.push(99);
        break;

      case "violence":
        filters.withoutGenres.push(27, 53, 80);
        break;

      case "none":
      default:
        break;
    }
  });

  // ============================
  // Eliminar duplicados
  // ============================

  filters.withGenres = [
    ...new Set(filters.withGenres),
  ];

  filters.withoutGenres = [
    ...new Set(filters.withoutGenres),
  ];

  filters.withoutGenres =
    filters.withoutGenres.filter(
      (id) => !filters.withGenres.includes(id)
    );

  return filters;
}