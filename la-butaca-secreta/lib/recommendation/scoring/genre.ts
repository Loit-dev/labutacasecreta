import {
  ScoreContext,
  ScoredItem,
} from "./types";

export const GenreMap: Record<
  string,
  number[]
> = {
  scifi: [878],

  action: [
    28, // Acción
    12, // Aventura
    14, // Fantasía
  ],

  thriller: [
    53,   // Thriller
    9648, // Misterio
    80,   // Crimen
  ],

  comedy: [35],

  horror: [27],

  drama: [18],

  romance: [10749],

  family: [
    10751, // Familia
    16,    // Animación
  ],
};

// Cuántos de los primeros géneros cuentan como "el género principal".
// Acción y aventuras es una sola opción: cualquiera de las dos vale.
const PRIMARY_COUNT: Record<string, number> = {
  action: 2,
};

export function scoreGenre(
  item: ScoredItem,
  context: ScoreContext
): number {
  const preferredGenre =
    context.profile.preferredGenre;

  if (!preferredGenre) {
    return 0;
  }

  const targetGenres =
    GenreMap[preferredGenre];

  if (!targetGenres) {
    return 0;
  }

  const primaryCount =
    PRIMARY_COUNT[preferredGenre] ?? 1;

  let score = 0;
  let primaryHit = false;

  targetGenres.forEach(
    (genreId, index) => {
      if (!item.genres.includes(genreId)) {
        return;
      }

      // Género principal (se cuenta una sola vez)
      if (index < primaryCount) {
        if (!primaryHit) {
          score += 35;
          primaryHit = true;
        }
      } else {
        // Coincidencias relacionadas
        score += 8;
      }
    }
  );

  return score;
}