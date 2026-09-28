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

const PreferredGenreMap: Record<
  string,
  number[]
> = {
  scifi: [878],

  action: [28],

  thriller: [53],

  comedy: [35],

  horror: [27],

  drama: [18],

  romance: [10749],

  adventure: [12],
};

export function buildFilters(
  profile: UserProfile
): RecommendationFilters {
  const filters: RecommendationFilters = {
    type: profile.contentType ?? "movie",

    withGenres: [],

    withoutGenres: [],
  };

  // ============================
  // Género elegido por el usuario
  // ============================

  if (profile.preferredGenre) {
    const genres =
      PreferredGenreMap[
        profile.preferredGenre
      ];

    if (genres) {
      filters.withGenres.push(
        ...genres
      );
    }
  }

  // ============================
  // Estado de ánimo
  //
  // El mood NO filtra.
  // El scoring decide qué títulos
  // encajan mejor con la sensación.
  // ============================

  if (profile.mood) {
    const mood =
      MoodGenres[
        profile.mood as keyof typeof MoodGenres
      ];

    if (mood?.excludedGenres) {
      filters.withoutGenres.push(
        ...mood.excludedGenres
      );
    }
  }

  // ============================
  // Compañía
  // Se gestiona mediante scoring
  // ============================

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

  // ============================
  // Limpiar duplicados
  // ============================

  filters.withGenres = [
    ...new Set(filters.withGenres),
  ];

  filters.withoutGenres = [
    ...new Set(filters.withoutGenres),
  ];

  // Una exclusión nunca puede ganar
  // a una selección explícita.
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