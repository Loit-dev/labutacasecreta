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
      // Estos moods representan
      // una sensación más que un género.
      // Dejamos que el scoring decida.

      const scoringOnlyMoods = [
        "laugh",
        "adventure",
      ];

      if (
        !scoringOnlyMoods.includes(
          profile.mood
        ) &&
        mood.genres.length > 0
      ) {
        filters.withGenres.push(
          mood.genres[0]
        );
      }

      if (mood.excludedGenres) {
        filters.withoutGenres.push(
          ...mood.excludedGenres
        );
      }
    }
  }

  // ============================
  // Compañía
  // Se gestiona mediante scoring
  // ============================

  switch (profile.company) {
    case "alone":
    case "partner":
    case "friends":
    case "family":
    default:
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
  // Nuevo / Clásico
  // ============================

  switch (profile.freshness) {
    case "new":
      filters.releaseAfter =
        "2022-01-01";
      break;

    case "classic":
      filters.releaseBefore =
        "2005-12-31";
      break;
  }

  // ============================
  // Restricciones
  // ============================

  profile.restrictions?.forEach(
    (restriction) => {
      switch (restriction) {
        case "terror":
          filters.withoutGenres.push(
            27
          );
          break;

        case "romance":
          filters.withoutGenres.push(
            10749
          );
          break;

        case "musical":
          filters.withoutGenres.push(
            10402
          );
          break;

        case "documentary":
          filters.withoutGenres.push(
            99
          );
          break;

        case "violence":
          filters.withoutGenres.push(
            27,
            53,
            80
          );
          break;

        case "none":
        default:
          break;
      }
    }
  );

  filters.withGenres = [
    ...new Set(filters.withGenres),
  ];

  filters.withoutGenres = [
    ...new Set(filters.withoutGenres),
  ];

  filters.withoutGenres =
    filters.withoutGenres.filter(
      (id) =>
        !filters.withGenres.includes(id)
    );

  console.log(
    "FILTERS:",
    filters
  );

  return filters;
}