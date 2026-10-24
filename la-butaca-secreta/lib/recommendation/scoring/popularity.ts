import { ScoreContext, ScoredItem } from "./types";

/**
 * Antes la nota media pesaba hasta 20 puntos y la popularidad bruta
 * de TMDb, como mucho, 5: un título con pocos fans muy entregados
 * (nota altísima) le ganaba fácilmente a un taquillazo mainstream
 * (nota más discreta, pero visto y buscado por muchísima más gente).
 * Eso es lo que hacía que, en la práctica, ganasen más veces títulos
 * de nicho con fandom muy fiel frente a estrenos grandes. No se toca
 * nada por idioma o país: solo se reequilibra cuánto pesa cada cosa.
 */
export function scorePopularity(
  item: ScoredItem,
  _context: ScoreContext
): number {
  let score = 0;

  // Valoración media

  if (item.voteAverage >= 8.5) {
    score += 12;
  } else if (item.voteAverage >= 8) {
    score += 9;
  } else if (item.voteAverage >= 7.5) {
    score += 6;
  } else if (item.voteAverage >= 7) {
    score += 3;
  } else if (item.voteAverage < 6.5) {
    // Notas flojas: TMDb deja pasar desde 6.0 y no queremos que
    // un 6.1 empate con un 6.9 solo por encajar un poco mejor.
    score -= 10;
  }

  // Confianza en la nota

  if (item.voteCount >= 10000) {
    score += 4;
  } else if (item.voteCount >= 5000) {
    score += 3;
  } else if (item.voteCount >= 1000) {
    score += 2;
  } else if (item.voteCount >= 300) {
    score += 1;
  }

  // Popularidad actual (cuánto se busca/ve ahora mismo): es la señal
  // que mejor refleja un taquillazo mainstream, así que ahora pesa
  // más que la nota media en vez de menos.
  if (item.popularity >= 1000) {
    score += 15;
  } else if (item.popularity >= 500) {
    score += 10;
  } else if (item.popularity >= 200) {
    score += 6;
  } else if (item.popularity >= 100) {
    score += 3;
  }

  return score;
}
