import { ScoreContext, ScoredItem } from "./types";

export function scoreProviders(
  _item: ScoredItem,
  _context: ScoreContext
): number {
  // Más adelante utilizaremos este módulo para puntuar
  // según las plataformas elegidas por el usuario
  // (Netflix, Prime Video, Disney+, Max, Apple TV+, etc.)

  return 0;
}