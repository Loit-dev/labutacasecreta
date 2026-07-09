import { ScoreContext, ScoredItem } from "./types";

import { scoreMood } from "./mood";
import { scoreCompany } from "./company";
import { scoreDuration } from "./duration";
import { scorePopularity } from "./popularity";
import { scoreProviders } from "./providers";
import { scoreDiscoveryMode } from "./discoveryMode";
import { scoreFreshness } from "./freshness";

export function scoreItem(
  item: ScoredItem,
  context: ScoreContext
): number {
  let score = 0;

  // Qué quiere sentir
  score += scoreMood(item, context) * 3;

  // Qué busca hoy
  score += scoreDiscoveryMode(
    item,
    context
  ) * 5;

  // Con quién va a verlo
  score += scoreCompany(item, context) * 2;

  // Disponible en streaming
  score += scoreProviders(
    item,
    context
  ) * 3;

  // Duración
  score += scoreDuration(
    item,
    context
  );

  // Nuevo o clásico
  score += scoreFreshness(
    item,
    context
  );

  // Calidad general
  score += scorePopularity(
    item,
    context
  );

  return score;
}

export function sortByScore(
  items: ScoredItem[],
  context: ScoreContext
): ScoredItem[] {
  return items
    .map((item) => ({
      ...item,
      score: scoreItem(item, context),
    }))
    .sort((a, b) => b.score - a.score);
}