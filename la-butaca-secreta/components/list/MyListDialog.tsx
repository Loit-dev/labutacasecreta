"use client";

import Image from "next/image";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";
import { useWatchlist } from "@/hooks/useWatchlist";

type Props = {
  onClose: () => void;
};

export default function MyListDialog({ onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);

  const { items, remove, clear } = useWatchlist();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mylist-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="mylist-title"
              className="text-lg font-bold text-white"
            >
              Mi lista
            </h2>

            <p className="text-xs text-zinc-400">
              Guardada solo en este navegador.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {items.length === 0 ? (
          <p
            role="status"
            className="rounded-2xl bg-black/40 px-4 py-8 text-center text-sm text-zinc-300"
          >
            Tu lista está vacía. Pulsa «Guardar para ver
            luego» en cualquier recomendación.
          </p>
        ) : (
          <ul className="-mr-1 flex flex-col gap-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <li
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 rounded-2xl bg-black/40 p-2"
              >
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {item.poster && (
                    <Image
                      src={item.poster}
                      alt=""
                      fill
                      unoptimized={item.poster.endsWith(".svg")}
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {item.title}
                  </p>

                  <p className="text-xs text-zinc-300">
                    {item.type === "tv" ? "Serie" : "Película"}
                    {item.year ? ` · ${item.year}` : ""}
                    {item.rating ? ` · ★ ${item.rating}` : ""}
                  </p>

                  {item.platforms.length > 0 && (
                    <p className="truncate text-xs text-zinc-400">
                      {item.platforms.join(" · ")}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => remove(item.id, item.type)}
                  aria-label={`Quitar de mi lista: ${item.title}`}
                  className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <button
            onClick={clear}
            className="self-center text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Vaciar mi lista
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
