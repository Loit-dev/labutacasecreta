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
  // Usamos SOLO el género principal
  // para no restringir demasiado TMDB
  // ============================

  if (profile.mood) {
    switch (profile.mood) {
      case "tension":
        filters.withGenres.push(53); // Thriller
        break;

      case "risas":
        filters.withGenres.push(35); // Comedia
        break;

      case "emocion":
        filters.withGenres.push(28); // Acción
        break;

      case "ternura":
        filters.withGenres.push(10749); // Romance
        break;

      case "miedo":
        filters.withGenres.push(27); // Terror
        break;

      case "fantasia":
        filters.withGenres.push(14); // Fantasía
        break;

      default: {
        const mood =
          MoodGenres[
            profile.mood as keyof typeof MoodGenres
          ];

        if (mood) {
          filters.withGenres.push(
            mood.genres[0]
          );
        }
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
  // Nuevo / Clásico
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

  profile.restrictions?.forEach(
    (restriction) => {
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
      (id) => !filters.withGenres.includes(id)
    );

  console.log("FILTERS:", filters);

  return filters;
}