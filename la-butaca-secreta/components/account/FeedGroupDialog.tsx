"use client";

import Image from "next/image";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";
import type { FeedGroup } from "@/lib/supabase/feed";

type Props = {
  name: string;
  group: FeedGroup;
  onClose: () => void;
};

/**
 * Muestra el detalle de una ráfaga agrupada en Novedades ("vio Aida y
 * 4+"): todos los títulos que esa persona vio o añadió, no solo el
 * primero. Sin enlaces a fichas: el feed no trae tmdbId, solo título
 * y póster.
 */
export default function FeedGroupDialog({ name, group, onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);

  const first = group.items[0];
  const subtitle =
    first.kind === "watched"
      ? "Títulos vistos"
      : first.kind === "list_item_added"
        ? `Añadidos a «${first.listName}»`
        : "Listas creadas";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feed-group-dialog-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="feed-group-dialog-title" className="text-lg font-bold text-white">
              {name}
            </h2>
            <p className="text-xs text-zinc-400">{subtitle}</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="-mr-1 flex flex-col gap-2 overflow-y-auto pr-1">
          {group.items.map((item, index) => {
            const title = item.kind === "list_created" ? item.listName : item.title;
            const poster = item.kind === "list_created" ? null : item.posterUrl;
            const detail =
              item.kind === "watched" && item.rating ? `★ ${item.rating}` : null;

            return (
              <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2"
              >
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-zinc-800">
                  {poster && <Image src={poster} alt="" fill className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {new Date(item.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                    {detail ? ` · ${detail}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
