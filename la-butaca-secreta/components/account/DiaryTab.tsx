"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";

import RatingPrompt from "@/components/recommendations/RatingPrompt";
import type { Rating } from "@/lib/rating";
import { deleteWatched, updateWatchedRating } from "@/lib/supabase/watched";
import { fetchWatchedHistory, type WatchedRow } from "@/lib/supabase/summary";

import StarDisplay from "./StarDisplay";

type EditTarget = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  rating?: Rating;
};

function monthLabel(dateStr: string): string {
  const date = new Date(dateStr);

  const label = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(date);

  // "agosto de 2026" → "AGOSTO 2026"
  return label.replace(" de ", " ").toUpperCase();
}

function dayNumber(dateStr: string): string {
  return String(new Date(dateStr).getDate());
}

export default function DiaryTab({ session }: { session: Session }) {
  const [rows, setRows] = useState<WatchedRow[] | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchWatchedHistory(session.user.id).then((data) => {
      if (!cancelled) setRows(data);
    });

    return () => {
      cancelled = true;
    };
  }, [session.user.id]);

  const rowKey = (row: WatchedRow) => `${row.mediaType}-${row.tmdbId}`;

  const confirmRating = async (rating: Rating | undefined) => {
    const target = editing;

    setEditing(null);

    if (!target) return;

    const key = `${target.mediaType}-${target.tmdbId}`;

    setBusyKey(key);

    const ok = await updateWatchedRating(
      { userId: session.user.id, tmdbId: target.tmdbId, mediaType: target.mediaType },
      rating
    );

    setBusyKey(null);

    if (ok) {
      setRows((prev) =>
        prev?.map((row) =>
          row.tmdbId === target.tmdbId && row.mediaType === target.mediaType
            ? { ...row, rating }
            : row
        ) ?? null
      );
    }
  };

  const removeEntry = async (row: WatchedRow) => {
    if (!window.confirm(`¿Borrar "${row.title}" de tu diario?`)) return;

    const key = rowKey(row);

    setBusyKey(key);

    const ok = await deleteWatched({
      userId: session.user.id,
      tmdbId: row.tmdbId,
      mediaType: row.mediaType,
    });

    setBusyKey(null);

    if (ok) {
      setRows((prev) => prev?.filter((r) => rowKey(r) !== key) ?? null);
    }
  };

  if (rows === null) {
    return <p className="text-center text-sm text-zinc-300">Cargando…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-black/30 px-4 py-8 text-center text-sm text-zinc-300">
        Todavía no hay nada en tu diario. Marca alguna película o serie
        como "Ya la vi" y aparecerá aquí.
      </p>
    );
  }

  // Agrupa por mes, conservando el orden (más reciente primero) que
  // ya trae fetchWatchedHistory.
  const groups: { label: string; rows: WatchedRow[] }[] = [];

  for (const row of rows) {
    const label = monthLabel(row.seenAt);
    const last = groups[groups.length - 1];

    if (last && last.label === label) {
      last.rows.push(row);
    } else {
      groups.push({ label, rows: [row] });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-xs font-bold tracking-wide text-zinc-400">
            {group.label}
          </p>

          <ul className="flex flex-col gap-2">
            {group.rows.map((row) => {
              const key = rowKey(row);
              const href = `/${row.mediaType === "tv" ? "serie" : "pelicula"}/${row.tmdbId}`;

              return (
                <li
                  key={key}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-sm font-bold text-zinc-300">
                    {dayNumber(row.seenAt)}
                  </div>

                  <Link
                    href={href}
                    className="min-w-0 flex-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <p className="truncate text-sm font-semibold text-white">
                      {row.title}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {row.mediaType === "tv" ? "Serie" : "Película"}
                    </p>
                  </Link>

                  <button
                    type="button"
                    disabled={busyKey === key}
                    onClick={() =>
                      setEditing({
                        tmdbId: row.tmdbId,
                        mediaType: row.mediaType,
                        title: row.title,
                        rating: row.rating,
                      })
                    }
                    className="shrink-0 rounded-lg p-1 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    title="Cambiar valoración"
                  >
                    <StarDisplay value={row.rating ?? 0} />
                  </button>

                  <button
                    type="button"
                    disabled={busyKey === key}
                    onClick={() => removeEntry(row)}
                    aria-label={`Borrar del diario: ${row.title}`}
                    className="shrink-0 rounded-lg border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 hover:border-red-500/60 hover:text-red-300 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {editing && (
        <RatingPrompt
          title={editing.title}
          initial={editing.rating}
          editing
          onConfirm={confirmRating}
        />
      )}
    </div>
  );
}
