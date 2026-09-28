import {
  ScoreContext,
  ScoredItem,
} from "./types";

export function scoreDiscoveryMode(
  item: ScoredItem,
  context: ScoreContext
): number {
  const mode =
    context.profile.discoveryMode;

  if (!mode) {
    return 0;
  }

  switch (mode) {
    case "impact":
      // Busca títulos especialmente bien valorados.
      if (item.voteAverage >= 8.5) {
        return 40;
      }

      if (item.voteAverage >= 8) {
        return 30;
      }

      if (item.voteAverage >= 7.5) {
        return 15;
      }

      return 0;

    case "relax":
      // Experiencia ligera y fácil de consumir.
      if (item.genres.includes(35)) {
        return 20;
      }

      if (item.genres.includes(12)) {
        return 10;
      }

      if (item.genres.includes(28)) {
        return 5;
      }

      // Penalizamos experiencias más densas.
      if (item.genres.includes(18)) {
        return -10;
      }

      if (item.genres.includes(9648)) {
        return -8;
      }

      if (item.genres.includes(27)) {
        return -15;
      }

      return 0;

    case "hidden-gem":
      if (
        item.voteAverage >= 7.5 &&
        item.voteCount >= 100 &&
        item.voteCount <= 5000
      ) {
        return 40;
      }

      return 0;

    case "surprise":
      // No queremos que la aleatoriedad destruya
      // la relevancia del resto del scoring.
      return Math.floor(Math.random() * 15);

    default:
      return 0;
  }
}