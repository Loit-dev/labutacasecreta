import {
  ScoreContext,
  ScoredItem,
} from "./types";

const GenreMap: Record<
  string,
  number[]
> = {
  scifi: [878],

  action: [28],

  thriller: [
    53,   // Thriller
    9648, // Misterio
    80,   // Crimen
  ],

  comedy: [35],

  horror: [27],

  drama: [18],

  romance: [10749],

  adventure: [
    12, // Aventura
    14, // Fantasía
  ],
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

  let score = 0;

  targetGenres.forEach(
    (genreId, index) => {
      if (!item.genres.includes(genreId)) {
        return;
      }

      // Primera coincidencia = género principal
      if (index === 0) {
        score += 35;
      } else {
        // Coincidencias relacionadas
        score += 8;
      }
    }
  );

  return score;
}