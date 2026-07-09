import { ScoreContext, ScoredItem } from "./types";

export function scoreAudience(
  item: ScoredItem,
  context: ScoreContext
): number {
  const company =
    context.profile.company;

  let score = 0;

  // En familia no penalizamos
  // contenido familiar.

  if (company === "family") {
    return 0;
  }

  // Contenido familiar

  if (
    company !== "family" &&
    item.genres.includes(10751)
  ) {
    score -= 50;
  }

  // Familiar + Animación

  if (
    item.genres.includes(10751) &&
    item.genres.includes(16)
  ) {
    score -= 15;
  }

  // Ligero bonus para contenido
  // más orientado a adultos

  if (item.genres.includes(10749)) {
    score += 5;
  }

  if (item.genres.includes(53)) {
    score += 5;
  }

  if (item.genres.includes(80)) {
    score += 5;
  }

  return score;
}