"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import Link from "next/link";

import { useDialog } from "@/hooks/useDialog";
import { searchProfiles, type ProfileRow } from "@/lib/supabase/profiles";
import { fetchFollowingIds, follow, unfollow } from "@/lib/supabase/follows";
import {
  fetchFriendStatuses,
  sendFriendRequest,
  type FriendStatus,
} from "@/lib/supabase/friends";

type Props = {
  userId: string;
  onClose: () => void;
};

type Row = {
  profile: ProfileRow;
  following: boolean;
  friendStatus: FriendStatus;
};

export default function BuscarAmigosDialog({ userId, onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (query.trim().length < 2) {
      setRows([]);
      return;
    }

    setLoading(true);

    // Un poco de espera tras la última tecla: sin esto, cada letra
    // escrita disparaba de inmediato la búsqueda y, por cada uno de
    // los hasta 20 resultados, dos consultas más (seguir / amistad) —
    // podían ser más de 40 peticiones a Supabase por tecla.
    const timeout = setTimeout(async () => {
      const profiles = await searchProfiles(query, userId);

      if (cancelled) return;

      if (profiles.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const otherIds = profiles.map((profile) => profile.userId);

      // Dos consultas para TODOS los resultados a la vez (a quién
      // sigues, y el estado de amistad con cada uno), no dos por
      // resultado: antes eran hasta 40 peticiones en paralelo por
      // búsqueda, ahora son siempre 2.
      const [followingIds, friendStatuses] = await Promise.all([
        fetchFollowingIds(userId),
        fetchFriendStatuses(userId, otherIds),
      ]);

      if (cancelled) return;

      const followingSet = new Set(followingIds);

      setRows(
        profiles.map((profile) => ({
          profile,
          following: followingSet.has(profile.userId),
          friendStatus: friendStatuses.get(profile.userId)?.status ?? "none",
        }))
      );
      setLoading(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, userId]);

  async function handleFollow(row: Row) {
    const ok = row.following
      ? await unfollow(userId, row.profile.userId)
      : await follow(userId, row.profile.userId);

    if (ok) {
      setRows((prev) =>
        prev.map((r) =>
          r.profile.userId === row.profile.userId
            ? { ...r, following: !r.following }
            : r
        )
      );
    }
  }

  async function handleFriendRequest(row: Row) {
    const ok = await sendFriendRequest(userId, row.profile.userId);

    if (ok) {
      setRows((prev) =>
        prev.map((r) =>
          r.profile.userId === row.profile.userId
            ? { ...r, friendStatus: "pending_sent" }
            : r
        )
      );
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="buscar-amigos-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="buscar-amigos-title" className="text-lg font-bold text-white">
            Buscar amigos
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/25 px-3 py-2.5">
          <span className="text-zinc-500">@</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="usuario"
            autoFocus
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto">
          {loading && (
            <p className="text-center text-sm text-zinc-400">Buscando…</p>
          )}

          {!loading && query.trim().length >= 2 && rows.length === 0 && (
            <p className="text-center text-sm text-zinc-400">
              Nadie con ese nombre todavía.
            </p>
          )}

          {rows.map((row) => (
            <div
              key={row.profile.userId}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
            >
              <Link
                href={`/u/${row.profile.username}`}
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-xs font-extrabold text-black">
                  {row.profile.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {row.profile.displayName ?? row.profile.username}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    @{row.profile.username}
                  </p>
                </div>
              </Link>

              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => handleFollow(row)}
                  className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
                    row.following
                      ? "border border-white/20 text-zinc-300"
                      : "bg-amber-300 text-black"
                  }`}
                >
                  {row.following ? "Siguiendo" : "Seguir"}
                </button>

                {row.friendStatus === "none" && (
                  <button
                    onClick={() => handleFriendRequest(row)}
                    className="rounded-full border border-amber-300 px-3 py-1.5 text-xs font-extrabold text-amber-300"
                  >
                    Pedir amistad
                  </button>
                )}
                {row.friendStatus === "pending_sent" && (
                  <span className="self-center text-xs font-bold text-zinc-400">
                    Solicitud enviada
                  </span>
                )}
                {row.friendStatus === "friends" && (
                  <span className="self-center text-xs font-bold text-zinc-400">
                    Ya sois amigos
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
