"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { track } from "@/lib/analytics";
import type { SearchHit } from "@/lib/search";

type Status = "idle" | "loading" | "ready" | "error";

// Espera a que la persona deje de teclear antes de preguntar a TMDb
const DEBOUNCE_MS = 350;

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  const trackedQuery = useRef<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setStatus("idle");
      setHits([]);
      return;
    }

    let cancelled = false;

    setStatus("loading");

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );

        if (!response.ok) throw new Error(`search ${response.status}`);

        const data: SearchHit[] = await response.json();

        if (cancelled) return;

        setHits(data);
        setStatus("ready");

        // Una vez por búsqueda, no en cada letra
        if (trackedQuery.current !== trimmed) {
          trackedQuery.current = trimmed;

          track("search_query", { count: data.length });
        }
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="relative">
      <label htmlFor="buscador-titulo" className="sr-only">
        Buscar una película o serie
      </label>

      <input
        id="buscador-titulo"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Escribe el título de una película o serie…"
        autoComplete="off"
        className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-base"
      />

      <div
        aria-live="polite"
        className="mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 empty:hidden"
      >
        {status === "loading" && (
          <p className="px-4 py-3 text-sm text-zinc-400">Buscando…</p>
        )}

        {status === "error" && (
          <p className="px-4 py-3 text-sm text-red-300" role="alert">
            No he podido buscar ahora mismo. Prueba otra vez en un rato.
          </p>
        )}

        {status === "ready" && hits.length === 0 && (
          <p className="px-4 py-3 text-sm text-zinc-400">
            No he encontrado nada con ese título.
          </p>
        )}

        {status === "ready" && hits.length > 0 && (
          <ul>
            {hits.map((hit) => (
              <li
                key={`${hit.type}-${hit.id}`}
                className="border-b border-zinc-800 last:border-0"
              >
                <Link
                  href={`/${hit.type === "tv" ? "serie" : "pelicula"}/${hit.id}`}
                  onClick={() =>
                    track("search_result_click", {
                      id: hit.id,
                      type: hit.type,
                    })
                  }
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-black">
                    {hit.poster ? (
                      <Image
                        src={hit.poster}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {hit.title}
                    </p>

                    <p className="text-xs text-zinc-400">
                      {hit.type === "tv" ? "Serie" : "Película"}
                      {hit.year ? ` · ${hit.year}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
