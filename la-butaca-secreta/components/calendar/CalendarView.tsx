"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  buildMonthGrid,
  parseMonth,
  platformsOfDay,
  shiftMonth,
  type CalendarEntry,
} from "@/lib/calendar";
import { PLATFORMS, type PlatformKey } from "@/lib/platforms";

type Props = {
  // Plataformas que el usuario ha marcado
  platforms: PlatformKey[];
};

type MonthData = {
  days: Record<string, CalendarEntry[]>;
  logos: Partial<Record<PlatformKey, string>>;
};

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const LABELS = Object.fromEntries(
  PLATFORMS.map((platform) => [platform.key, platform.label])
) as Record<PlatformKey, string>;

function todayKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function monthTitle(key: string) {
  const parsed = parseMonth(key);

  if (!parsed) return key;

  return new Date(
    Date.UTC(parsed.year, parsed.month - 1, 1)
  ).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dayTitle(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function PlatformLogo({
  platform,
  logos,
  size,
}: {
  platform: PlatformKey;
  logos: MonthData["logos"];
  size: number;
}) {
  const logo = logos[platform];

  return logo ? (
    <Image
      src={logo}
      alt={LABELS[platform]}
      title={LABELS[platform]}
      width={size}
      height={size}
      className="rounded-md"
    />
  ) : (
    <span
      title={LABELS[platform]}
      className="rounded-md bg-zinc-700 px-1 text-[10px] font-bold text-white"
    >
      {LABELS[platform].slice(0, 3)}
    </span>
  );
}

export default function CalendarView({ platforms: mine }: Props) {
  const today = todayKey();

  const [month, setMonth] = useState(today.substring(0, 7));
  const [selected, setSelected] = useState<string | null>(today);
  const [data, setData] = useState<Record<string, MonthData>>({});
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (data[month]) return;

    const controller = new AbortController();

    fetch(`/api/calendar?month=${month}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));

        return response.json() as Promise<MonthData>;
      })
      .then((json) => {
        setData((current) => ({ ...current, [month]: json }));
        setFailed(null);
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") {
          setFailed(month);
        }
      });

    return () => controller.abort();
  }, [month, data]);

  const current = data[month];

  const weeks = useMemo(() => {
    const parsed = parseMonth(month);

    return parsed ? buildMonthGrid(parsed.year, parsed.month) : [];
  }, [month]);

  // Estrenos de cada día, solo de las plataformas elegidas
  function entriesOf(date: string): CalendarEntry[] {
    return (current?.days[date] ?? [])
      .map((entry) => ({
        ...entry,
        platforms: entry.platforms.filter((p) => mine.includes(p)),
      }))
      .filter((entry) => entry.platforms.length > 0);
  }

  function go(delta: number) {
    const next = shiftMonth(month, delta);

    setMonth(next);
    setSelected(next === today.substring(0, 7) ? today : null);
  }

  const selectedEntries = selected ? entriesOf(selected) : [];

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2
          id="calendar-title"
          className="text-lg font-bold text-white"
        >
          Calendario de estrenos
        </h2>

        <p className="text-xs text-zinc-400">
          Novedades de {mine.map((p) => LABELS[p]).join(", ")}. Puedes
          cambiar tus plataformas en el Recomendador.
        </p>
      </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => go(-1)}
            aria-label="Mes anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">←</span>
          </button>

          <p
            aria-live="polite"
            className="text-base font-semibold capitalize text-white"
          >
            {monthTitle(month)}
          </p>

          <button
            onClick={() => go(1)}
            aria-label="Mes siguiente"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {failed === month && !current && (
          <p
            role="alert"
            className="rounded-2xl bg-black/40 px-4 py-6 text-center text-sm text-zinc-300"
          >
            No he podido cargar los estrenos de este mes. Inténtalo
            de nuevo en un rato.
          </p>
        )}

        {!current && failed !== month && (
          <p
            role="status"
            className="rounded-2xl bg-black/40 px-4 py-6 text-center text-sm text-zinc-300"
          >
            Buscando estrenos…
          </p>
        )}

        {current && (
          <div role="group" aria-label={`Días de ${monthTitle(month)}`}>
            <div
              aria-hidden="true"
              className="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] font-semibold text-zinc-400"
            >
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            {weeks.map((week, index) => (
              <div
                key={index}
                className="grid grid-cols-7 gap-1 pb-1"
              >
                {week.map((date, cell) => {
                  if (!date) {
                    return <span key={cell} />;
                  }

                  const entries = entriesOf(date);

                  const logos = platformsOfDay(entries, mine);

                  const isSelected = date === selected;

                  return (
                    <button
                      key={date}
                      onClick={() => setSelected(date)}
                      aria-pressed={isSelected}
                      aria-label={`${dayTitle(date)}: ${entries.length} ${entries.length === 1 ? "estreno" : "estrenos"}`}
                      className={`flex min-h-14 flex-col items-center gap-1 rounded-xl border p-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-20 ${
                        isSelected
                          ? "border-red-500 bg-red-500/15 text-white"
                          : date === today
                            ? "border-zinc-500 bg-zinc-800 text-white"
                            : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      <span className="font-semibold">
                        {Number(date.substring(8))}
                      </span>

                      <span className="flex flex-wrap justify-center gap-0.5">
                        {logos.slice(0, 4).map((platform) => (
                          <PlatformLogo
                            key={platform}
                            platform={platform}
                            logos={current.logos}
                            size={16}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {current && selected && (
          <section aria-live="polite" className="mt-1">
            <h3 className="text-sm font-bold capitalize text-white">
              {dayTitle(selected)}
            </h3>

            {selectedEntries.length === 0 ? (
              <p className="mt-2 rounded-2xl bg-black/40 px-4 py-5 text-center text-sm text-zinc-300">
                No hay estrenos este día en tus plataformas.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {selectedEntries.map((entry) => (
                  <li
                    key={`${entry.type}-${entry.id}`}
                    className="flex gap-3 rounded-2xl border border-zinc-800 bg-black/30 p-2"
                  >
                    {entry.poster ? (
                      <Image
                        src={entry.poster}
                        alt=""
                        width={56}
                        height={84}
                        className="h-21 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="h-21 w-14 shrink-0 rounded-lg bg-zinc-800" />
                    )}

                    <div className="min-w-0 flex-1">
                      <a
                        href={
                          entry.id > 0
                            ? `https://www.themoviedb.org/${entry.type}/${entry.id}?language=es-ES`
                            : `https://www.themoviedb.org/search?query=${encodeURIComponent(entry.title)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-2 text-sm font-semibold text-white underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {entry.title}
                        <span className="sr-only">
                          {" "}
                          (se abre en una pestaña nueva)
                        </span>
                      </a>

                      <p className="mt-0.5 text-xs text-zinc-400">
                        {entry.type === "tv" ? "Serie" : "Película"}
                        {entry.note && ` · ${entry.note}`}
                        {entry.rating > 0 && ` · ⭐ ${entry.rating}`}
                      </p>

                      <div className="mt-1 flex items-center gap-1">
                        {entry.confirmed && (
                          <span
                            title="Confirmado por TMDb y TVmaze"
                            className="mr-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
                          >
                            <span aria-hidden="true">✓</span> 2 fuentes
                            <span className="sr-only">
                              : confirmado por TMDb y TVmaze
                            </span>
                          </span>
                        )}

                        {entry.platforms.map((platform) => (
                          <PlatformLogo
                            key={platform}
                            platform={platform}
                            logos={current.logos}
                            size={22}
                          />
                        ))}
                      </div>

                      {entry.overview && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-300">
                          {entry.overview}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <p className="text-[11px] text-zinc-400">
          Datos: TMDb y TVmaze. «✓ 2 fuentes» = las dos coinciden en el
          día. Las fechas son las de estreno en España y pueden variar
          un poco.
        </p>
    </div>
  );
}
