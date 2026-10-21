import { UserProfile } from "@/lib/conversation/types";
import { MoodGenres } from "./genres";

export interface RecommendationFilters {
  type: "movie" | "tv";

  withGenres: number[];

  // Si es true, basta con que tenga UNO de esos géneros (acción o aventura);
  // si no, tiene que tenerlos todos.
  withGenresAny?: boolean;

  withoutGenres: number[];

  runtimeLte?: number;

  runtimeGte?: number;

  releaseAfter?: string;

  releaseBefore?: string;

  // Ajustes del "pool" de candidatos según lo que busca el usuario
  sortBy?: "popularity.desc" | "vote_average.desc";

  minVotes?: number;

  maxVotes?: number;

  minRating?: number;

  // Plataformas (ids de TMDb) donde buscar; sin esto, todas las permitidas
  providerIds?: number[];
}

const PreferredGenreMap: Record<
  string,
  number[]
> = {
  scifi: [878],

  // Acción y aventuras van juntas: vale cualquiera de las dos
  action: [28, 12],

  thriller: [53],

  comedy: [35],

  horror: [27],

  drama: [18],

  romance: [10749],

  // Infantil y familiar
  family: [10751],
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

      filters.withGenresAny = genres.length > 1;
    }

    // Para ver con niños: nada de terror, thriller ni crimen
    if (profile.preferredGenre === "family") {
      filters.withoutGenres.push(27, 53, 80);
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

    // Animación se suma a lo anterior: ahora hacen falta todos
    filters.withGenresAny = false;
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
      // "Nuevo" = últimos ~3 años (se calcula con el año actual,
      // para que no se quede anticuado con el tiempo).
      filters.releaseAfter = `${
        new Date().getFullYear() - 3
      }-01-01`;
      break;

    case "classic":
      filters.releaseBefore =
        "2005-12-31";
      break;
  }

  // ============================
  // Qué busca hoy
  //
  // Cambia el "pool" de candidatos: sin esto, TMDb siempre
  // devolvería lo más popular y una "joya oculta" nunca
  // llegaría a aparecer entre los candidatos.
  // ============================

  switch (profile.discoveryMode) {
    case "impact":
      filters.sortBy = "vote_average.desc";
      filters.minVotes = 1000;
      filters.minRating = 7.5;
      break;

    case "hidden-gem":
      filters.sortBy = "vote_average.desc";
      filters.minVotes = 100;
      filters.maxVotes = 5000;
      filters.minRating = 7;
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

  return filters;
}