/**
 * Dato extra de la tarjeta de "Compatibilidad": un actor, actriz o
 * director que se repite entre los títulos en los que más coincidís
 * (lib/compatibility.ts ya calcula esos títulos, aquí solo se mira
 * el reparto). Pide el reparto a /api/credits (TMDb necesita un
 * token de servidor, así que no se puede llamar directo desde aquí)
 * y, si algo falla, simplemente no aparece ningún dato extra.
 */

export type TitleCredits = {
  director: string | null;
  cast: string[];
};

export type SharedPerson = {
  name: string;
  role: "director" | "actor";
};

// Con un solo título en común no significa nada que "coincida" un
// actor: hace falta que se repita en al menos dos de los títulos
// mirados para contar como un patrón real.
const MIN_SHARED_APPEARANCES = 2;

/** Agregación pura (sin red): de los créditos ya obtenidos, elige el nombre que más se repite. */
export function pickSharedPerson(credits: TitleCredits[]): SharedPerson | null {
  const directorCounts = new Map<string, number>();
  const castCounts = new Map<string, number>();

  for (const credit of credits) {
    if (credit.director) {
      directorCounts.set(
        credit.director,
        (directorCounts.get(credit.director) ?? 0) + 1
      );
    }

    for (const name of credit.cast) {
      castCounts.set(name, (castCounts.get(name) ?? 0) + 1);
    }
  }

  // Un director en común pesa más que un actor en común: dirige el
  // tono de la película, así que dice más sobre gustos parecidos.
  const bestDirector = [...directorCounts.entries()]
    .filter(([, count]) => count >= MIN_SHARED_APPEARANCES)
    .sort((a, b) => b[1] - a[1])[0];

  if (bestDirector) {
    return { name: bestDirector[0], role: "director" };
  }

  const bestActor = [...castCounts.entries()]
    .filter(([, count]) => count >= MIN_SHARED_APPEARANCES)
    .sort((a, b) => b[1] - a[1])[0];

  if (bestActor) {
    return { name: bestActor[0], role: "actor" };
  }

  return null;
}

async function fetchTitleCredits(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<TitleCredits> {
  try {
    const response = await fetch(
      `/api/credits?id=${tmdbId}&type=${mediaType}`
    );

    if (!response.ok) return { director: null, cast: [] };

    const data = await response.json();

    return {
      director: typeof data.director === "string" ? data.director : null,
      cast: Array.isArray(data.cast) ? data.cast : [],
    };
  } catch {
    return { director: null, cast: [] };
  }
}

/** Pide el reparto de cada título y busca un nombre que se repita entre ellos. */
export async function findSharedPerson(
  titles: { tmdbId: number; mediaType: "movie" | "tv" }[]
): Promise<SharedPerson | null> {
  const credits = await Promise.all(
    titles.map((title) => fetchTitleCredits(title.tmdbId, title.mediaType))
  );

  return pickSharedPerson(credits);
}
