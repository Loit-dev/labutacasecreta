"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";
import { todayDateInput } from "@/lib/dateInput";

type Props = {
  title: string;
  /** Fecha actual, en YYYY-MM-DD (huso horario local). */
  initial: string;
  onConfirm: (seenAt: string) => void;
  onCancel: () => void;
};

/**
 * Cambiar la fecha de una entrada ya puesta en el diario (tocar la
 * fecha de una fila en DiaryTab.tsx). Al confirmar, la lista se
 * reordena cronológicamente con la nueva fecha.
 */
export default function EditSeenDateDialog({
  title,
  initial,
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initial);

  const close = () => onCancel();

  const dialogRef = useDialog<HTMLDivElement>(close);

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Cambiar la fecha en la que viste ${title}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-6 py-6 text-center shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
      >
        <p className="marquee-font text-xl text-white">
          ¿Cuándo viste <span className="text-zinc-300">{title}</span>?
        </p>

        <label className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-300">
          <input
            type="date"
            value={value}
            max={todayDateInput()}
            onChange={(event) => setValue(event.target.value)}
            className="rounded-lg border border-zinc-700/80 bg-black/40 px-2 py-1 text-white [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
        </label>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={close}
            className="marquee-font flex-1 rounded-2xl border border-zinc-700 px-5 py-3 text-base text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => onConfirm(value)}
            className="marquee-font flex-1 rounded-2xl bg-white px-5 py-3 text-base text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
