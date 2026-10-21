/**
 * TVmaze (api.tvmaze.com): fuente gratuita y sin clave con el calendario
 * de episodios de las plataformas de streaming. Aquí solo se usa para
 * encontrar series y temporadas nuevas y contrastarlas con TMDb.
 */

import type { PlatformKey } from "./platforms";

export type TvmazeEpisode = {
  season: number;
  number: number | null;
  airdate: string;
  type?: string;
  _embedded?: {
    show?: {
      id: number;
      name: string;
      webChannel?: { name?: string } | null;
      externals?: {
        imdb?: string | null;
        thetvdb?: number | null;
      };
    };
  };
};

export type Premiere = {
  showId: number;
  name: string;
  date: string;
  season: number;
  platform: PlatformKey;
  imdb: string | null;
  tvdb: number | null;
};

// Nombre del canal en TVmaze → plataforma de la web
const CHANNELS: Record<string, PlatformKey> = {
  netflix: "netflix",
  "prime video": "prime",
  "amazon prime video": "prime",
  "amazon prime": "prime",
  "disney+": "disney",
  "disney plus": "disney",
  max: "max",
  "hbo max": "max",
  filmin: "filmin",
};

export function platformOfChannel(
  name: string | undefined | null
): PlatformKey | null {
  if (!name) return null;

  return CHANNELS[name.trim().toLowerCase()] ?? null;
}

/**
 * Del calendario de un día se queda con los primeros episodios de
 * temporada (series y temporadas nuevas) de nuestras plataformas.
 * Un mismo capítulo repetido o un especial no cuentan.
 */
export function premieresFrom(
  episodes: readonly TvmazeEpisode[]
): Premiere[] {
  const found = new Map<string, Premiere>();

  for (const episode of episodes) {
    const show = episode._embedded?.show;

    if (
      !show ||
      episode.number !== 1 ||
      (episode.type && episode.type !== "regular") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(episode.airdate ?? "")
    ) {
      continue;
    }

    const platform = platformOfChannel(show.webChannel?.name);

    if (!platform) continue;

    const key = `${show.id}|${episode.season}`;

    if (found.has(key)) continue;

    found.set(key, {
      showId: show.id,
      name: show.name,
      date: episode.airdate,
      season: episode.season,
      platform,
      imdb: show.externals?.imdb ?? null,
      tvdb: show.externals?.thetvdb ?? null,
    });
  }

  return [...found.values()];
}

/** «Nueva temporada 3» o «Estreno de la serie» según el caso. */
export function premiereNote(season: number): string {
  return season <= 1
    ? "Estreno de la serie"
    : `Nueva temporada (${season})`;
}
