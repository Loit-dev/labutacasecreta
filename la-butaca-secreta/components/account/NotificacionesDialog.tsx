"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import Image from "next/image";

import { useDialog } from "@/hooks/useDialog";
import {
  fetchNotifications,
  type NotificationItem,
} from "@/lib/supabase/notifications";
import { respondFriendRequest } from "@/lib/supabase/friends";
import { respondListInvite } from "@/lib/supabase/listInvites";
import { dismissRecommendation } from "@/lib/supabase/recommendations";
import { addToList } from "@/lib/watchlist";
import { markNotificationsSeenNow } from "@/lib/notificationsSeen";

type Props = {
  userId: string;
  onClose: () => void;
};

export default function NotificacionesDialog({ userId, onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    fetchNotifications(userId).then(setItems);
    markNotificationsSeenNow();
  }, [userId]);

  function removeItem(predicate: (item: NotificationItem) => boolean) {
    setItems((prev) => (prev ? prev.filter((i) => !predicate(i)) : prev));
  }

  async function handleFriendRequest(id: string, accept: boolean) {
    const ok = await respondFriendRequest(id, accept);
    if (ok) removeItem((i) => i.kind === "friend_request" && i.id === id);
  }

  async function handleListInvite(id: string, accept: boolean) {
    const ok = await respondListInvite(id, accept);
    if (ok) removeItem((i) => i.kind === "list_invite" && i.id === id);
  }

  async function handleAddPending(item: Extract<NotificationItem, { kind: "recommendation" }>) {
    addToList({
      id: item.tmdbId,
      type: item.mediaType,
      title: item.title,
      poster: item.posterUrl ?? undefined,
      platforms: [],
    });
    const ok = await dismissRecommendation(item.id);
    if (ok) removeItem((i) => i.kind === "recommendation" && i.id === item.id);
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
        aria-labelledby="notificaciones-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="notificaciones-title" className="text-lg font-bold text-white">
            Notificaciones
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {items === null && (
          <p className="text-center text-sm text-zinc-400">Cargando…</p>
        )}

        {items !== null && items.length === 0 && (
          <p
            role="status"
            className="rounded-2xl bg-black/40 px-4 py-10 text-center text-sm text-zinc-300"
          >
            Sin novedades por aquí. Las solicitudes, invitaciones y
            recomendaciones que recibas aparecerán aquí.
          </p>
        )}

        <div className="flex flex-col gap-2 overflow-y-auto">
          {items?.map((item, index) => {
            if (item.kind === "friend_request") {
              return (
                <div
                  key={`fr-${item.id}`}
                  className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] p-3"
                >
                  <p className="text-sm text-white">
                    <span className="font-bold">
                      {item.from?.displayName ?? item.from?.username ?? "Alguien"}
                    </span>{" "}
                    quiere ser tu amigo
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleFriendRequest(item.id, true)}
                      className="rounded-full bg-amber-300 px-3 py-1.5 text-xs font-extrabold text-black"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleFriendRequest(item.id, false)}
                      className="rounded-full border border-white/25 px-3 py-1.5 text-xs font-extrabold text-zinc-300"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            }

            if (item.kind === "list_invite") {
              return (
                <div
                  key={`li-${item.id}`}
                  className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] p-3"
                >
                  <p className="text-sm text-white">
                    <span className="font-bold">
                      {item.from?.displayName ?? item.from?.username ?? "Alguien"}
                    </span>{" "}
                    te invita a editar{" "}
                    <span className="font-bold">
                      {item.listName ?? "una lista"}
                    </span>
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleListInvite(item.id, true)}
                      className="rounded-full bg-amber-300 px-3 py-1.5 text-xs font-extrabold text-black"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleListInvite(item.id, false)}
                      className="rounded-full border border-white/25 px-3 py-1.5 text-xs font-extrabold text-zinc-300"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            }

            if (item.kind === "recommendation") {
              return (
                <div
                  key={`rec-${item.id}`}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="relative h-14 w-9 shrink-0 overflow-hidden rounded bg-zinc-800">
                    {item.posterUrl && (
                      <Image src={item.posterUrl} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">
                      <span className="font-bold">
                        {item.from?.displayName ?? item.from?.username ?? "Alguien"}
                      </span>{" "}
                      te recomienda{" "}
                      <span className="font-bold">{item.title}</span>
                    </p>
                    {item.message && (
                      <p className="mt-0.5 text-xs italic text-zinc-400">
                        "{item.message}"
                      </p>
                    )}
                    <button
                      onClick={() => handleAddPending(item)}
                      className="mt-2 rounded-full border border-amber-300 px-3 py-1.5 text-xs font-extrabold text-amber-300"
                    >
                      + Añadir a pendientes
                    </button>
                  </div>
                </div>
              );
            }

            // new_follower: solo informativa.
            return (
              <div
                key={`fol-${item.createdAt}-${index}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-amber-400 text-xs font-extrabold text-black">
                  {(item.from?.username ?? "??").slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm text-white">
                  <span className="font-bold">
                    {item.from?.displayName ?? item.from?.username ?? "Alguien"}
                  </span>{" "}
                  te sigue ahora
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
