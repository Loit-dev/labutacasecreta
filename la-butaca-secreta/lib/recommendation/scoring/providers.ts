import { ScoreContext, ScoredItem } from "./types";

const STREAMING_PROVIDERS = [
  "Netflix",
  "Prime Video",
  "Amazon Prime Video",
  "Disney Plus",
  "Disney+",
  "Max",
  "HBO Max",
  "Apple TV+",
  "Apple TV Plus",
  "Movistar Plus+",
  "Filmin",
  "SkyShowtime",
];

export function scoreProviders(
  item: ScoredItem,
  // No se usa: la firma la fija ScoreFn (todas las funciones de
  // puntuación reciben el contexto, lo use cada una o no).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: ScoreContext
): number {
  if (!item.providers?.length) {
    return -100;
  }

  let score = 0;

  for (const provider of item.providers) {
    if (
      STREAMING_PROVIDERS.includes(provider)
    ) {
      score += 15;
    }
  }

  // Bonus por estar disponible en varias plataformas
  if (item.providers.length >= 2) {
    score += 10;
  }

  if (item.providers.length >= 3) {
    score += 5;
  }

  return score;
}