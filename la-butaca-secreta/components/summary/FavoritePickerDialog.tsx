"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";
import { track } from "@/lib/analytics";
import type { SearchHit } from "@/lib/search";

type Props = {
  onPick: (hit: SearchHit) => void;
  onClose: () => void;
};

type Status = "idle" | "loading" | "ready" | "error";

const DEBOUNCE_MS = 350;

/** Buscador para elegir a mano la tarjeta "favorita" de Mi Resumen. */
export default function FavoritePickerDialog({ onPick, onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);

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

        if (trackedQuery.current !== trimmed) {
          trackedQuery.current = trimmed;

          track("search_query", { count: data.length, source: "summary" });
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorite-picker-title"
        tabIndex={-1}
        className="relative flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="favorite-picker-title"
            className="text-lg font-bold text-white"
          >
            Elige tu favorita
          </h2>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <label htmlFor="buscador-favorita" className="sr-only">
          Buscar una película o serie
        </label>

        <input
          id="buscador-favorita"
          type="search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Escribe el título de una película o serie…"
          autoComplete="off"
          className="w-full rounded-2xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        />

        <div
          aria-live="polite"
          className="min-h-16 flex-1 overflow-y-auto rounded-2xl border border-zinc-800 bg-black/30"
        >
          {status === "idle" && (
            <p className="px-4 py-3 text-sm text-zinc-400">
              Escribe al menos 3 letras.
            </p>
          )}

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
                  <button
                    type="button"
                    onClick={() => onPick(hit)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
