"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";
import {
  addListItem,
  deleteList,
  removeListItem,
  renameList,
  type ListRow,
} from "@/lib/supabase/lists";
import type { SearchHit } from "@/lib/search";

import TitlePickerDialog from "./TitlePickerDialog";

type Props = {
  list: ListRow;
  onClose: () => void;
  onChange: (list: ListRow) => void;
  onDeleted: () => void;
};

/** Ver, renombrar, añadir/quitar títulos y borrar una lista. */
export default function ListDetailDialog({
  list,
  onClose,
  onChange,
  onDeleted,
}: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);

  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);

  const saveName = async () => {
    const trimmed = name.trim();

    setRenaming(false);

    if (!trimmed || trimmed === list.name) {
      setName(list.name);
      return;
    }

    const ok = await renameList(list.id, trimmed);

    if (ok) {
      onChange({ ...list, name: trimmed });
    } else {
      setName(list.name);
    }
  };

  const pickTitle = async (hit: SearchHit) => {
    const item = await addListItem({
      listId: list.id,
      tmdbId: hit.id,
      mediaType: hit.type,
      title: hit.title,
      posterUrl: hit.poster,
    });

    if (item) {
      onChange({
        ...list,
        items: [
          item,
          ...list.items.filter(
            (existing) =>
              !(existing.tmdbId === item.tmdbId && existing.mediaType === item.mediaType)
          ),
        ],
      });
    }
  };

  const removeTitle = async (itemId: string) => {
    const ok = await removeListItem(itemId);

    if (ok) {
      onChange({
        ...list,
        items: list.items.filter((item) => item.id !== itemId),
      });
    }
  };

  const deleteThisList = async () => {
    if (!window.confirm(`¿Borrar la lista "${list.name}"?`)) return;

    setBusy(true);

    const ok = await deleteList(list.id);

    setBusy(false);

    if (ok) onDeleted();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-detail-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={saveName}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveName();
                if (event.key === "Escape") {
                  setName(list.name);
                  setRenaming(false);
                }
              }}
              className="w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-1.5 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="text-left"
              title="Renombrar lista"
            >
              <h2
                id="list-detail-title"
                className="text-lg font-bold text-white underline decoration-dotted underline-offset-4"
              >
                {list.name}
              </h2>
              <p className="text-xs text-zinc-400">
                {list.items.length}{" "}
                {list.items.length === 1 ? "título" : "títulos"}
              </p>
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPicking(true)}
          className="self-start rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          + Añadir título
        </button>

        {list.items.length === 0 ? (
          <p
            role="status"
            className="rounded-2xl bg-black/40 px-4 py-8 text-center text-sm text-zinc-300"
          >
            Esta lista está vacía. Pulsa «+ Añadir título» para empezar.
          </p>
        ) : (
          <div className="-mr-1 grid grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
            {list.items.map((item) => {
              const href = `/${item.mediaType === "tv" ? "serie" : "pelicula"}/${item.tmdbId}`;
              const poster = item.posterUrl;

              return (
                <div key={item.id} className="group relative">
                  <Link
                    href={href}
                    className="block overflow-hidden rounded-xl bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <div className="relative aspect-[2/3] w-full">
                      {poster ? (
                        <Image
                          src={poster}
                          alt=""
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2 text-center text-[11px] text-zinc-400">
                          {item.title}
                        </div>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={() => removeTitle(item.id)}
                    aria-label={`Quitar de la lista: ${item.title}`}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-xs text-white opacity-0 transition-opacity hover:bg-black focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={deleteThisList}
          disabled={busy}
          className="self-center text-xs text-zinc-400 underline underline-offset-2 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
        >
          Borrar esta lista
        </button>
      </div>

      {picking && (
        <TitlePickerDialog
          heading={`Añadir a "${list.name}"`}
          addedKey={(hit) =>
            list.items.some(
              (item) => item.tmdbId === hit.id && item.mediaType === hit.type
            )
          }
          onPick={pickTitle}
          onClose={() => setPicking(false)}
        />
      )}
    </div>,
    document.body
  );
}
