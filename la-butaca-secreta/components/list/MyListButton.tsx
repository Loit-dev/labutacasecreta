"use client";

import { useCallback, useState } from "react";

import { BookmarkIcon } from "@/components/icons/Icons";
import { useWatchlist } from "@/hooks/useWatchlist";
import { track } from "@/lib/analytics";

import MyListDialog from "./MyListDialog";

/**
 * Botón fijo «Mi lista (N)». Solo aparece cuando hay algo guardado.
 */
export default function MyListButton() {
  const { count } = useWatchlist();

  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  if (count === 0 && !open) return null;

  return (
    <>
      <button
        onClick={() => {
          track("list_open", { count });
          setOpen(true);
        }}
        className="fixed right-3 top-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm md:backdrop-blur hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <BookmarkIcon size={14} /> Mi lista ({count})
      </button>

      {open && <MyListDialog onClose={close} />}
    </>
  );
}
