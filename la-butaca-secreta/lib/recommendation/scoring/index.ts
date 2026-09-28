import { ScoreContext, ScoredItem } from "./types";
import { scoreMood } from "./mood";
import { scoreCompany } from "./company";
import { scoreDuration } from "./duration";
import { scorePopularity } from "./popularity";
import { scoreProviders } from "./providers";
import { scoreDiscoveryMode } from "./discoveryMode";
import { scoreFreshness } from "./freshness";
import { scoreAudience } from "./audience";
import { scoreGenre } from "./genre";

export function scoreItem(
  item: ScoredItem,
  context: ScoreContext
): number {
  let score = 0;

  /**
   * PESOS DEL MOTOR
   *
   * La idea es que las respuestas del usuario
   * tengan mucho más peso que la popularidad
   * general de TMDB.
   */

  // 😊 Estado de ánimo
  score += scoreMood(item, context) * 2;

  // 🎭 Género/preferencia explícita
  score += scoreGenre(item, context) * 3;

  // 🧠 Qué busca hoy
  score += scoreDiscoveryMode(item, context) * 2;

  // ❤️ Con quién lo ve
  score += scoreCompany(item, context) * 2;

  // 👥 Público objetivo
  score += scoreAudience(item, context);

  // 📺 Servicios disponibles
  score += scoreProviders(item, context);

  // ⏱️ Duración
  score += scoreDuration(item, context);

  // ⭐ Nuevo / clásico
  score += scoreFreshness(item, context) * 2;

  // 📈 Calidad/popularidad general
  // Tiene peso deliberadamente bajo:
  // una película popular no debe ganar simplemente
  // por ser popular si encaja peor con el usuario.
  score += scorePopularity(item, context);

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