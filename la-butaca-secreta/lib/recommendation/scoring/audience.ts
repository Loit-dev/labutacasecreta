import { effectiveCompany } from "./company";
import { ScoreContext, ScoredItem } from "./types";

const ANIMATION_PENALTY = 20;

export function scoreAudience(
  item: ScoredItem,
  context: ScoreContext
): number {
  const company = effectiveCompany(
    context.profile
  );

  let score = 0;

  // En familia no penalizamos
  // contenido familiar.

  if (company === "family") {
    return 0;
  }

  // Animación: sin que lo hayan pedido, se prefiere el «imagen real».
  // (No hay pregunta sobre animación, y sin este ajuste las series de
  // acción o aventuras salen casi todas de dibujos o anime.)
  if (
    item.genres.includes(16) &&
    context.profile.animation !== "yes"
  ) {
    score -= ANIMATION_PENALTY;
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