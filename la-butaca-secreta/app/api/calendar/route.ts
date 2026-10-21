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
  getTvFlatrateIds,
} from "@/lib/tmdb/api";
import {
  premieresFrom,
  premiereNote,
  type TvmazeEpisode,
} from "@/lib/tvmaze";
import type { TMDBMovie } from "@/lib/tmdb/types";

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
              !!entry.digital &&
              entry.digital.date >= from &&
              entry.digital.date <= to
          )
          .map(({ item, digital }) =>
            toEntry(
              item,
              "movie",
              digital.date,
              platform.key,
              digital.region === "US"
                ? "Fecha de estreno en EE. UU."
                : digital.region === "OTHER"
                  ? "Fecha de estreno digital en otro país"
                  : undefined
            )
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

    const entries = mergeSources(tmdbEntries, tvmaze);

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
