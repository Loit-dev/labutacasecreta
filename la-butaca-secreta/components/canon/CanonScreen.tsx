"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";

import { CheckBadgeIcon, ClapperIcon, ScrollIcon } from "@/components/icons/Icons";
import { fetchWatchedHistory } from "@/lib/supabase/summary";
import type { CanonResult } from "@/lib/canon";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: CanonResult[] };

type Filter = "todas" | "vistas" | "pendientes";

const DECADES = [1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const;

function decadeLabel(decade: number): string {
  return `${String(decade).slice(2)}s`;
}

/**
 * "El Canon": 250 películas imprescindibles (data/canon/canon250.ts),
 * resueltas contra TMDb por /api/canon (con poster e id reales), con
 * progreso según el diario del usuario y filtros por década y por
 * visto/pendiente.
 */
export default function CanonScreen({ session }: { session: Session }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [watchedIds, setWatchedIds] = useState<Set<number> | null>(null);
  const [decade, setDecade] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("todas");
  const [country, setCountry] = useState<string | null>(null);
  const [directorQuery, setDirectorQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/canon")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items: CanonResult[]) => {
        if (!cancelled) setState({ status: "ready", items });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    fetchWatchedHistory(session.user.id).then((rows) => {
      if (cancelled) return;

      setWatchedIds(
        new Set(
          rows
            .filter((row) => row.mediaType === "movie")
            .map((row) => row.tmdbId)
        )
      );
    });

    return () => {
      cancelled = true;
    };
  }, [session.user.id]);

  const items = useMemo(
    () => (state.status === "ready" ? state.items : []),
    [state]
  );

  const countries = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.country))).sort((a, b) =>
      a.localeCompare(b, "es")
    );
  }, [items]);

  const watchedCount = useMemo(() => {
    if (!watchedIds) return 0;

    return items.filter((item) => item.tmdbId && watchedIds.has(item.tmdbId)).length;
  }, [items, watchedIds]);

  const visible = useMemo(() => {
    const normalizedDirectorQuery = directorQuery.trim().toLocaleLowerCase("es");

    return items.filter((item) => {
      if (decade !== null && item.decade !== decade) return false;
      if (country !== null && item.country !== country) return false;

      if (
        normalizedDirectorQuery &&
        !item.director.toLocaleLowerCase("es").includes(normalizedDirectorQuery)
      ) {
        return false;
      }

      if (!watchedIds) return true;

      const seen = Boolean(item.tmdbId && watchedIds.has(item.tmdbId));

      if (filter === "vistas") return seen;
      if (filter === "pendientes") return !seen;

      return true;
    });
  }, [items, decade, filter, watchedIds, country, directorQuery]);

  const total = items.length || 250;
  const pct = total > 0 ? Math.round((watchedCount / total) * 100) : 0;

  if (state.status === "error") {
    return (
      <p className="text-center text-sm text-zinc-300">
        No se ha podido cargar El Canon ahora mismo. Prueba más tarde.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="marquee-font flex items-center justify-center gap-2 text-2xl text-white">
          <ScrollIcon size={22} className="text-amber-300" />
          El Canon
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          250 películas imprescindibles de la historia del cine
        </p>
      </div>

      <div className="rounded-3xl border border-white/20 bg-black/20 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-white">Tu progreso</span>
          <span className="text-sm font-bold text-amber-300">
            {watchedIds ? `${watchedCount} / ${total}` : "…"}
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {watchedIds && (
          <p className="mt-2 text-center text-xs text-zinc-400">
            {pct}% completado
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["todas", "pendientes", "vistas"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              filter === f
                ? "border-amber-300 bg-amber-400/15 text-amber-200"
                : "border-white/15 bg-black/20 text-zinc-300 hover:bg-white/5"
            }`}
          >
            {f === "todas" ? "Todas" : f === "pendientes" ? "Pendientes" : "Vistas"}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
        <button
          type="button"
          onClick={() => setDecade(null)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            decade === null
              ? "border-amber-300 bg-amber-400/15 text-amber-200"
              : "border-white/15 bg-black/20 text-zinc-300 hover:bg-white/5"
          }`}
        >
          Todas las décadas
        </button>

        {DECADES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDecade(decade === d ? null : d)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              decade === d
                ? "border-amber-300 bg-amber-400/15 text-amber-200"
                : "border-white/15 bg-black/20 text-zinc-300 hover:bg-white/5"
            }`}
          >
            {decadeLabel(d)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={directorQuery}
          onChange={(event) => setDirectorQuery(event.target.value)}
          placeholder="Buscar por director..."
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex-1"
        />

        <select
          value={country ?? ""}
          onChange={(event) => setCountry(event.target.value || null)}
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-56"
        >
          <option value="">Todos los países</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {state.status === "loading" ? (
        <p className="text-center text-sm text-zinc-300">Cargando El Canon…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl bg-black/30 px-4 py-8 text-center text-sm text-zinc-300">
          Nada que mostrar con estos filtros.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((item) => {
            const seen = Boolean(item.tmdbId && watchedIds?.has(item.tmdbId));
            const href = item.tmdbId ? `/pelicula/${item.tmdbId}` : undefined;

            const content = (
              <>
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {item.poster ? (
                    <Image
                      src={item.poster}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-500">
                      <ClapperIcon size={18} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    {item.director} · {item.year}
                  </p>
                </div>

                {seen && (
                  <span
                    aria-label="Ya la has visto"
                    title="Ya la has visto"
                    className="shrink-0 text-amber-300"
                  >
                    <CheckBadgeIcon size={20} />
                  </span>
                )}
              </>
            );

            return (
              <li
                key={`${item.title}-${item.year}`}
                className={`flex items-center gap-3 rounded-2xl border p-2.5 ${
                  seen
                    ? "border-amber-300/30 bg-amber-400/5"
                    : "border-white/10 bg-black/30"
                }`}
              >
                {href ? (
                  <Link
                    href={href}
                    className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
