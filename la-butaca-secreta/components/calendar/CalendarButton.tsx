"use client";

import { useCallback, useState } from "react";

import { track } from "@/lib/analytics";

import CalendarDialog from "./CalendarDialog";

/** Botón fijo «Calendario» (arriba a la izquierda). */
export default function CalendarButton() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        onClick={() => {
          track("calendar_open");
          setOpen(true);
        }}
        className="fixed left-3 top-3 z-40 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span aria-hidden="true">📅</span> Calendario
      </button>

      {open && <CalendarDialog onClose={close} />}
    </>
  );
}
