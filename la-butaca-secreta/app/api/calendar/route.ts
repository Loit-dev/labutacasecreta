import { NextRequest, NextResponse } from "next/server";

import {
  daysInMonth,
  groupByDay,
  mergeSources,
  monthRange,
  parseMonth,
  type CalendarEntry,
} from "@/lib/calendar";
import { PLATFORMS, type PlatformKey } from "@/lib/platforms";
import {
  discoverCalendar,
  findTvByExternalId,
  getProviderLogos,
  getDigitalDate,
  getFlatrateIds,
  getFallback,
  getTvFlatrateIds,
  searchTitle,
} from "@/lib/tmdb/api";
import {
  premieresFrom,
  premiereNote,
  type TvmazeEpisode,
} from "@/lib/tvmaze";
import type { TMDBMovie } from "@/lib/tmdb/types";
import { DESTACADOS } from "@/data/calendar/destacados";
import { translateToSpanish } from "@/lib/translate";
import { getFallbackPoster } from "@/lib/posterFallback";
import { IMPORTADOS } from "@/data/calendar/decine21";

export const dynamic = "force-dynamic";

// Comprobar un mes entero contra TVmaze son muchas consultas la primera vez
export const maxDuration = 60;

const POSTER_BASE = "https://image.tmdb.org/t/p/w185";

// Consultas simultáneas a TMDb al comprobar fechas de estreno
const CONCURRENCY = 10;

async function mapLimited<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;

      out[index] = await task(items[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(limit, items.length) },
      worker
    )
  );

  return out;
}

function toEntry(
  item: TMDBMovie,
  type: "movie" | "tv",
  date: string,
  platform: PlatformKey,
  note?: string
): CalendarEntry {
  return {
    id: item.id,
    type,
    title: item.title ?? item.name ?? "Sin título",
    date,
    poster: item.poster_path
      ? `${POSTER_BASE}${item.poster_path}`
      : null,
    overview: item.overview ?? "",
    rating: Math.round((item.vote_average ?? 0) * 10) / 10,
    popularity: item.popularity ?? 0,
    platforms: [platform],
    ...(note ? { note } : {}),
  };
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Calendario de un día de TVmaze (con un reintento si pide esperar). */
async function fetchSchedule(date: string): Promise<TvmazeEpisode[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(
      `https://api.tvmaze.com/schedule/web?date=${date}`,
      { next: { revalidate: 60 * 60 * 24 } }
    );

    if (response.status === 429) {
      await sleep(1500);
      continue;
    }

    if (!response.ok) throw new Error(`TVmaze ${response.status}`);

    const data: unknown = await response.json();

    return Array.isArray(data) ? (data as TvmazeEpisode[]) : [];
  }

  throw new Error("TVmaze ocupado");
}

/**
 * Series y temporadas nuevas según TVmaze, comprobadas en TMDb para
 * saber que de verdad están en esa plataforma en España.
 */
async function tvmazeEntries(
  year: number,
  month: number
): Promise<CalendarEntry[]> {
  const pad = (n: number) => String(n).padStart(2, "0");

  const dates = Array.from(
    { length: daysInMonth(year, month) },
    (_, i) => `${year}-${pad(month)}-${pad(i + 1)}`
  );

  const schedules = await mapLimited(dates, 4, (date) =>
    fetchSchedule(date).catch(() => [] as TvmazeEpisode[])
  );

  const premieres = schedules.flatMap((episodes) =>
    premieresFrom(episodes)
  );

  const resolved = await mapLimited(
    premieres,
    CONCURRENCY,
    async (premiere): Promise<CalendarEntry | null> => {
      try {
        const found = premiere.imdb
          ? await findTvByExternalId(premiere.imdb, "imdb_id")
          : premiere.tvdb
            ? await findTvByExternalId(premiere.tvdb, "tvdb_id")
            : null;

        if (!found) return null;

        const available = await getTvFlatrateIds(found.id);

        const platform = PLATFORMS.find(
          (candidate) =>
            candidate.key === premiere.platform &&
            candidate.ids.some((id) => available.includes(id))
        );

        if (!platform) return null;

        return {
          id: found.id,
          type: "tv",
          title: found.name ?? premiere.name,
          date: premiere.date,
          poster: found.poster_path
            ? `${POSTER_BASE}${found.poster_path}`
            : null,
          overview: found.overview ?? "",
          rating: Math.round((found.vote_average ?? 0) * 10) / 10,
          popularity: found.popularity ?? 0,
          platforms: [platform.key],
          note: premiereNote(premiere.season),
        };
      } catch {
        return null;
      }
    }
  );

  return resolved.filter(
    (entry): entry is CalendarEntry => entry !== null
  );
}

/**
 * Estrenos de la lista manual que caen en este mes. Se ignoran si TMDb
 * ya trae ese título (`known`).
 */
async function destacados(
  from: string,
  to: string,
  known: Set<string>
): Promise<CalendarEntry[]> {
  const inMonth = DESTACADOS.filter(
    (item) => item.date >= from && item.date <= to
  );

  const found = await mapLimited(
    inMonth,
    CONCURRENCY,
    async (item): Promise<CalendarEntry | null> => {
      const note = item.note ?? "Novedad en la plataforma";

      let match: TMDBMovie | null = null;

      if (item.match !== false) {
        try {
          match = await searchTitle(item.type, item.query, item.year);
        } catch {
          match = null;
        }
      }

      if (match && known.has(`${item.type}|${match.id}`)) return null;

      const base: CalendarEntry = match
        ? toEntry(match, item.type, item.date, item.platform, note)
        : {
            // Sin coincidencia en TMDb: se enseña solo con el título.
            // Id negativo y único para que no se mezcle con otros.
            id: -(DESTACADOS.indexOf(item) + 1),
            type: item.type,
            title: item.query,
            date: item.date,
            poster: null,
            overview: "",
            rating: 0,
            popularity: 0,
            platforms: [item.platform],
            note,
            unverified: true,
          };

      // Por delante de lo demás de su día, en el orden de la lista
      const position = DESTACADOS.indexOf(item);

      return {
        ...base,
        popularity: 10000 - position,
      };
    }
  );

  return found.filter(
    (entry): entry is CalendarEntry => entry !== null
  );
}

/**
 * Estrenos importados de decine21 que caen en este mes. La plataforma se
 * busca en TMDb (suscripción en España, solo las cinco nuestras); si TMDb
 * no sabe dónde está se usa la indicada a mano o se descarta.
 */
async function importados(
  from: string,
  to: string,
  known: Set<string>
): Promise<CalendarEntry[]> {
  const inMonth = IMPORTADOS.filter(
    (item) => item.date >= from && item.date <= to
  );

  const found = await mapLimited(
    inMonth,
    CONCURRENCY,
    async (item): Promise<CalendarEntry | null> => {
      try {
        // En temporadas nuevas el año de la fuente no es el de la serie
        const match = await searchTitle(
          item.type,
          item.query,
          item.type === "tv" && item.season ? undefined : item.year
        );

        if (!match) return null;
        if (known.has(`${item.type}|${match.id}`)) return null;

        const available = await getFlatrateIds(item.type, match.id);

        const platform =
          PLATFORMS.find((candidate) =>
            candidate.ids.some((id) => available.includes(id))
          )?.key ?? item.platform;

        if (!platform) return null;

        const note =
          item.type === "tv" && item.season
            ? premiereNote(item.season)
            : "Novedad en la plataforma";

        let entry = toEntry(
          match,
          item.type,
          item.date,
          platform,
          note
        );

        // Completa póster/sinopsis que falten con la ficha en inglés
        if (!entry.poster || !entry.overview) {
          try {
            const fallback = await getFallback(item.type, match.id);

            const overview = entry.overview
              ? entry.overview
              : await translateToSpanish(fallback.overview);

            let poster =
              entry.poster ??
              (fallback.poster_path
                ? `${POSTER_BASE}${fallback.poster_path}`
                : null);

            if (!poster) {
              poster = await getFallbackPoster(
                item.type,
                entry.title
              );
            }

            entry = { ...entry, poster, overview };
          } catch {
            // Sin ficha de repuesto: se queda como está
          }
        }

        known.add(`${item.type}|${match.id}`);

        return entry;
      } catch {
        return null;
      }
    }
  );

  return found.filter(
    (entry): entry is CalendarEntry => entry !== null
  );
}

export async function GET(request: NextRequest) {
  const month = parseMonth(
    request.nextUrl.searchParams.get("month")
  );

  if (!month) {
    return NextResponse.json(
      { error: "Mes no válido (usa AAAA-MM)." },
      { status: 400 }
    );
  }

  const { from, to } = monthRange(month.year, month.month);

  try {
    // Una consulta por plataforma y tipo (así sabemos dónde se estrena)
    const searches = PLATFORMS.flatMap((platform) =>
      (["movie", "tv"] as const).map((type) => ({
        platform,
        type,
      }))
    );

    const results = await Promise.allSettled(
      searches.map(async ({ platform, type }) => {
        const page = await discoverCalendar(type, {
          from,
          to,
          providerIds: platform.ids,
        });

        if (type === "tv") {
          return page.results
            .map((item) => ({
              item,
              date: item.first_air_date ?? "",
            }))
            .filter(
              ({ date }) => date >= from && date <= to
            )
            .map(({ item, date }) =>
              toEntry(item, "tv", date, platform.key)
            );
        }

        // Películas: la fecha buena es la del estreno digital
        const dated = await mapLimited(
          page.results,
          CONCURRENCY,
          async (item) => {
            try {
              return {
                item,
                digital: await getDigitalDate(item.id),
              };
            } catch {
              return { item, digital: null };
            }
          }
        );

        return dated
          .filter(
            (
              entry
            ): entry is {
              item: TMDBMovie;
              digital: { date: string; region: "ES" | "US" | "OTHER" };
            } =>
              // Solo estrenos con fecha confirmada en España; nada de
              // EE. UU. ni de otros países
              !!entry.digital &&
              entry.digital.region === "ES" &&
              entry.digital.date >= from &&
              entry.digital.date <= to
          )
          .map(({ item, digital }) =>
            toEntry(item, "movie", digital.date, platform.key)
          );
      })
    );

    const failed = results.filter(
      (result) => result.status === "rejected"
    ).length;

    if (failed === results.length) {
      return NextResponse.json(
        { error: "No se pudo consultar el calendario." },
        { status: 502 }
      );
    }

    const tmdbEntries = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

    // Contraste con TVmaze; si falla, se sigue solo con TMDb
    let tvmaze: CalendarEntry[] = [];

    try {
      tvmaze = await tvmazeEntries(month.year, month.month);
    } catch {
      tvmaze = [];
    }

    const merged = mergeSources(tmdbEntries, tvmaze);

    const known = new Set(
      merged.map((entry) => `${entry.type}|${entry.id}`)
    );

    const extra = await destacados(from, to, known).catch(
      () => [] as CalendarEntry[]
    );

    for (const entry of extra) known.add(`${entry.type}|${entry.id}`);

    const imported = await importados(from, to, known).catch(
      () => [] as CalendarEntry[]
    );

    const entries = [...merged, ...extra, ...imported];

    // Logos de cada plataforma (si no se pueden leer, la web usa texto)
    const logos: Partial<Record<PlatformKey, string>> = {};

    try {
      const byId = await getProviderLogos(
        PLATFORMS.flatMap((platform) => platform.ids)
      );

      for (const platform of PLATFORMS) {
        const id = platform.ids.find((candidate) => byId[candidate]);

        if (id) logos[platform.key] = byId[id];
      }
    } catch {
      // Sin logos: se muestran los nombres
    }

    return NextResponse.json(
      {
        month: month.key,
        days: groupByDay(entries),
        logos,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo consultar el calendario." },
      { status: 502 }
    );
  }
}
