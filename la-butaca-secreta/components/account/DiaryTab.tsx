"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";

import RatingPrompt from "@/components/recommendations/RatingPrompt";
import { ClapperIcon } from "@/components/icons/Icons";
import { dateInputToISO, isoToDateInput } from "@/lib/dateInput";
import type { Rating } from "@/lib/rating";
import {
  deleteWatched,
  updateWatchedRating,
  updateWatchedSeenAt,
} from "@/lib/supabase/watched";
import { fetchWatchedHistory, type WatchedRow } from "@/lib/supabase/summary";

import EditSeenDateDialog from "./EditSeenDateDialog";
import StarDisplay from "./StarDisplay";

const MONTH_ABBR = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

type EditTarget = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  rating?: Rating;
};

type DateEditTarget = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  seenAt: string;
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

function monthAbbr(dateStr: string): string {
  return MONTH_ABBR[new Date(dateStr).getMonth()];
}

export default function DiaryTab({ session }: { session: Session }) {
  const [rows, setRows] = useState<WatchedRow[] | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [editingDate, setEditingDate] = useState<DateEditTarget | null>(null);
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

  // Cambia la fecha de una entrada ya puesta (tocar la fecha de una
  // fila) y recoloca el diario cronológicamente con la nueva fecha:
  // se reordena todo el array, no solo esa fila, porque el agrupado
  // por mes de más abajo da por hecho que `rows` ya viene de más
  // reciente a más antiguo.
  const confirmDate = async (seenAtInput: string) => {
    const target = editingDate;

    setEditingDate(null);

    if (!target) return;

    const key = `${target.mediaType}-${target.tmdbId}`;

    setBusyKey(key);

    const seenAt = dateInputToISO(seenAtInput);

    const ok = await updateWatchedSeenAt(
      { userId: session.user.id, tmdbId: target.tmdbId, mediaType: target.mediaType },
      seenAt
    );

    setBusyKey(null);

    if (ok) {
      setRows((prev) =>
        prev
          ?.map((row) =>
            row.tmdbId === target.tmdbId && row.mediaType === target.mediaType
              ? { ...row, seenAt }
              : row
          )
          .sort((a, b) => (a.seenAt < b.seenAt ? 1 : a.seenAt > b.seenAt ? -1 : 0)) ??
        null
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
          <p className="marquee-font mb-2 text-sm text-zinc-400">
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
                  <button
                    type="button"
                    disabled={busyKey === key}
                    onClick={() =>
                      setEditingDate({
                        tmdbId: row.tmdbId,
                        mediaType: row.mediaType,
                        title: row.title,
                        seenAt: row.seenAt,
                      })
                    }
                    aria-label={`Cambiar la fecha en la que viste ${row.title}`}
                    title="Cambiar fecha"
                    className="flex h-11 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-zinc-700 transition-colors hover:border-amber-300/60 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span className="text-sm font-bold text-zinc-200">
                      {dayNumber(row.seenAt)}
                    </span>
                    <span className="text-[9px] font-bold tracking-wide text-zinc-500">
                      {monthAbbr(row.seenAt)}
                    </span>
                  </button>

                  <Link
                    href={href}
                    className="relative block h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {row.posterUrl ? (
                      <Image
                        src={row.posterUrl}
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
                  </Link>

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

      {editingDate && (
        <EditSeenDateDialog
          title={editingDate.title}
          initial={isoToDateInput(editingDate.seenAt)}
          onConfirm={confirmDate}
          onCancel={() => setEditingDate(null)}
        />
      )}
    </div>
  );
}
