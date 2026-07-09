import { ScoreContext, ScoredItem } from "./types";

export function scoreCompany(
  item: ScoredItem,
  context: ScoreContext
): number {
  let score = 0;

  switch (context.profile.company) {
    case "family":
      // Familiar
      if (item.genres.includes(10751)) {
        score += 25;
      }

      // Animación
      if (item.genres.includes(16)) {
        score += 20;
      }

      // Comedia
      if (item.genres.includes(35)) {
        score += 10;
      }

      // Terror
      if (item.genres.includes(27)) {
        score -= 40;
      }

      // Thriller
      if (item.genres.includes(53)) {
        score -= 20;
      }

      break;

    case "partner":
      // Drama
      if (item.genres.includes(18)) {
        score += 15;
      }

      // Thriller
      if (item.genres.includes(53)) {
        score += 15;
      }

      // Misterio
      if (item.genres.includes(9648)) {
        score += 12;
      }

      // Romance
      if (item.genres.includes(10749)) {
        score += 10;
      }

      break;

    case "friends":
      // Acción
      if (item.genres.includes(28)) {
        score += 20;
      }

      // Comedia
      if (item.genres.includes(35)) {
        score += 15;
      }

      // Aventura
      if (item.genres.includes(12)) {
        score += 10;
      }

      break;

    case "alone":
      // Ciencia ficción
      if (item.genres.includes(878)) {
        score += 10;
      }

      // Misterio
      if (item.genres.includes(9648)) {
        score += 10;
      }

      // Thriller
      if (item.genres.includes(53)) {
        score += 10;
      }

      break;

    default:
      break;
  }

  return score;
}