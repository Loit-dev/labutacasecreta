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