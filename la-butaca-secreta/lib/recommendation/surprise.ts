import { GenreNames } from "./genres";
import { ScoredItem } from "./scoring/types";

/**
 * "Una sorpresa que merece una oportunidad" (🥉)
 *
 * Cada tanda de 3 recomendaciones se compone de:
 *   🥇 🥈  las dos que mejor encajan (con variedad entre ellas)
 *   🥉     una sorpresa: muy buena nota, poco conocida y distinta
 *          a las otras dos en género o en época.
 *
 * Solo trabaja con títulos que ya han pasado todos los filtros
 * (plataformas, restricciones, etc.), así que una sorpresa nunca
 * rompe lo que el usuario ha pedido.
 */

export type TrioRole = "main" | "surprise";

export interface TrioEntry {
  item: ScoredItem;
  role: TrioRole;
  // Solo en sorpresas: qué la hace distinta (nombres de género)
  newGenres?: string[];
  differentEra?: boolean;
  // Si es de una época distinta: ¿más reciente que las otras dos?
  newer?: boolean;
}

// Una sorpresa debe tener buena nota...
const MIN_SURPRISE_RATING = 7;

// ...y ser poco conocida (de más a menos exigente)
const VOTE_CEILINGS = [3000, 10000, Infinity];

function yearOf(item: ScoredItem) {
  const year = Number(
    item.releaseDate?.substring(0, 4)
  );

  return Number.isFinite(year) && year > 0
    ? year
    : undefined;
}

function decadeOf(item: ScoredItem) {
  const year = yearOf(item);

  return year ? Math.floor(year / 10) : undefined;
}

function novelty(
  candidate: ScoredItem,
  mains: ScoredItem[]
) {
  const knownGenres = new Set(
    mains.flatMap((main) => main.genres)
  );

  const newGenres = candidate.genres.filter(
    (genre) => !knownGenres.has(genre)
  );

  const candidateDecade = decadeOf(candidate);

  const differentEra =
    candidateDecade !== undefined &&
    mains.every((main) => {
      const decade = decadeOf(main);

      return (
        decade !== undefined &&
        Math.abs(decade - candidateDecade) >= 1
      );
    });

  // ¿Más reciente que las recomendaciones principales?
  const candidateYear = yearOf(candidate);

  const mainYears = mains
    .map(yearOf)
    .filter((year): year is number => year !== undefined);

  const newer =
    candidateYear !== undefined &&
    mainYears.length > 0 &&
    candidateYear >
      mainYears.reduce((sum, year) => sum + year, 0) /
        mainYears.length;

  return { newGenres, differentEra, newer };
}

function surpriseScore(
  candidate: ScoredItem,
  mains: ScoredItem[]
) {
  const { newGenres, differentEra } = novelty(
    candidate,
    mains
  );

  return (
    // Calidad: lo más importante
    candidate.voteAverage * 10 +
    // Distinta en género y/o época
    newGenres.length * 8 +
    (differentEra ? 10 : 0) +
    // Un poco de encaje con lo que pidió el usuario
    candidate.score * 0.15 -
    // Cuanto menos conocida, mejor
    Math.min(candidate.voteCount / 1000, 10)
  );
}

function pickSurprise(
  rest: ScoredItem[],
  mains: ScoredItem[]
): ScoredItem | undefined {
  for (const ceiling of VOTE_CEILINGS) {
    const pool = rest.filter(
      (item) =>
        item.voteAverage >= MIN_SURPRISE_RATING &&
        item.voteCount <= ceiling
    );

    if (pool.length > 0) {
      return pool.sort(
        (a, b) =>
          surpriseScore(b, mains) -
          surpriseScore(a, mains)
      )[0];
    }
  }

  // Último recurso: el título mejor valorado que quede
  return [...rest].sort(
    (a, b) => b.voteAverage - a.voteAverage
  )[0];
}

function sameGenres(a: ScoredItem, b: ScoredItem) {
  return (
    a.genres.length === b.genres.length &&
    a.genres.every((genre) =>
      b.genres.includes(genre)
    )
  );
}

/**
 * Principales: siempre los que mejor encajan, en orden. Solo evitamos
 * que los dos de una misma tanda tengan exactamente los mismos géneros
 * ("nunca mostrar recomendaciones casi idénticas") y, si se puede, que
 * sean de épocas distintas (no dos clásicos de los años 70 seguidos).
 */
function pickMains(
  ranked: ScoredItem[],
  count: number
): ScoredItem[] {
  const pool = [...ranked];
  const mains: ScoredItem[] = [];

  while (mains.length < count && pool.length > 0) {
    const [first] = pool.splice(0, 1);

    mains.push(first);

    if (mains.length >= count) break;

    // El segundo de la tanda: el primero (entre los 5 siguientes)
    // que no repita los mismos géneros que el primero.
    const nearby = pool.slice(0, 5);

    const different = nearby.filter(
      (candidate) => !sameGenres(candidate, first)
    );

    // Primero se busca uno de otra década; si no hay, vale uno distinto
    const otherEra = different.find(
      (candidate) => decadeOf(candidate) !== decadeOf(first)
    );

    const chosen = otherEra ?? different[0];

    const index = chosen ? nearby.indexOf(chosen) : -1;

    const [second] = pool.splice(
      index === -1 ? 0 : index,
      1
    );

    if (second) mains.push(second);
  }

  return mains;
}

/**
 * Devuelve las recomendaciones en tandas de 3, en este orden:
 * principal, principal, sorpresa, principal, principal, sorpresa...
 *
 * `ranked` debe venir ordenado de mejor a peor encaje.
 */
export function buildTrios(
  ranked: ScoredItem[],
  maxTrios = 4
): TrioEntry[] {
  // Con menos de 3 títulos no hay tanda completa: se devuelven tal cual
  if (ranked.length < 3) {
    return ranked.map((item) => ({
      item,
      role: "main" as const,
    }));
  }

  const trios = Math.min(
    maxTrios,
    Math.floor(ranked.length / 3)
  );

  // Principales: los que mejor encajan, con variedad dentro de cada tanda
  const mainList = pickMains(ranked, trios * 2);

  const mainSet = new Set(mainList);

  const rest = ranked.filter(
    (item) => !mainSet.has(item)
  );

  const result: TrioEntry[] = [];

  for (let t = 0; t < trios; t++) {
    const mains = [
      mainList[t * 2],
      mainList[t * 2 + 1],
    ];

    const surprise = pickSurprise(rest, mains);

    mains.forEach((item) =>
      result.push({ item, role: "main" })
    );

    if (surprise) {
      rest.splice(rest.indexOf(surprise), 1);

      const { newGenres, differentEra, newer } =
        novelty(surprise, mains);

      result.push({
        item: surprise,
        role: "surprise",
        newGenres: newGenres
          .map((id) => GenreNames[id])
          .filter(Boolean),
        differentEra,
        newer,
      });
    }
  }

  return result;
}

/**
 * Motivo de una sorpresa. Solo dice cosas comprobables:
 * qué la distingue de las otras dos, su nota y su nº de votos.
 */
export function buildSurpriseReason(
  entry: TrioEntry
): string {
  const {
    item,
    newGenres = [],
    differentEra,
    newer,
  } = entry;

  const parts: string[] = [];

  if (newGenres.length > 0) {
    parts.push(
      `se sale de lo anterior con ${newGenres
        .slice(0, 2)
        .join(" y ")
        .toLowerCase()}`
    );
  } else if (differentEra) {
    const year = yearOf(item);

    if (year) {
      // «Otra época» solo tiene sentido hacia el pasado
      parts.push(
        newer
          ? `es bastante más reciente (${year})`
          : `viene de otra época (${year})`
      );
    }
  }

  const rating = item.voteAverage.toFixed(1);

  if (item.voteCount <= 3000) {
    parts.push(
      `tiene un ${rating} de nota y no la ha visto casi nadie`
    );
  } else {
    parts.push(
      `tiene un ${rating} de nota y merece una oportunidad`
    );
  }

  return `Mi sorpresa: ${parts.join("; ")}.`;
}
