import { NextRequest, NextResponse } from "next/server";

import {
  groupByDay,
  monthRange,
  parseMonth,
  type CalendarEntry,
} from "@/lib/calendar";
import { PLATFORMS, type PlatformKey } from "@/lib/platforms";
import {
  discoverCalendar,
  getProviderLogos,
  getSpanishDigitalDate,
} from "@/lib/tmdb/api";
import type { TMDBMovie } from "@/lib/tmdb/types";

export const dynamic = "force-dynamic";

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
  platform: PlatformKey
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
  };
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

        // Películas: la fecha buena es la del estreno digital en España
        const dated = await mapLimited(
          page.results,
          CONCURRENCY,
          async (item) => {
            try {
              return {
                item,
                date: await getSpanishDigitalDate(item.id),
              };
            } catch {
              return { item, date: null };
            }
          }
        );

        return dated
          .filter(
            (entry): entry is { item: TMDBMovie; date: string } =>
              !!entry.date &&
              entry.date >= from &&
              entry.date <= to
          )
          .map(({ item, date }) =>
            toEntry(item, "movie", date, platform.key)
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

    const entries = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

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
