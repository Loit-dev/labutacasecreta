import { ScoreContext, ScoredItem } from "./types";

import { scoreMood } from "./mood";
import { scoreCompany } from "./company";
import { scoreDuration } from "./duration";
import { scorePopularity } from "./popularity";
import { scoreProviders } from "./providers";
import { scoreDiscoveryMode } from "./discoveryMode";
import { scoreFreshness } from "./freshness";
import { scoreAudience } from "./audience";

export function scoreItem(
  item: ScoredItem,
  context: ScoreContext
): number {
  let score = 0;

  // Estado de ánimo
  // Sigue siendo lo más importante,
  // pero sin aplastar el resto.

  score +=
    scoreMood(
      item,
      context
    ) * 2;

  // Qué busca hoy

  score +=
    scoreDiscoveryMode(
      item,
      context
    ) * 3;

  // Con quién lo ve

  score +=
    scoreCompany(
      item,
      context
    ) * 2;

  // Público objetivo

  score +=
    scoreAudience(
      item,
      context
    );

  // Servicios de streaming

  score +=
    scoreProviders(
      item,
      context
    );

  // Duración

  score +=
    scoreDuration(
      item,
      context
    );

  // Nuevo o clásico

  score +=
    scoreFreshness(
      item,
      context
    ) * 2;

  // Calidad general

  score +=
    scorePopularity(
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
      score: scoreItem(
        item,
        context
      ),
    }))
    .sort(
      (a, b) => b.score - a.score
    );
}