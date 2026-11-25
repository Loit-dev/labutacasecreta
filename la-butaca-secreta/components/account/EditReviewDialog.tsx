"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";

const MAX_LENGTH = 2000;

type Props = {
  title: string;
  initial?: string;
  onConfirm: (review: string) => void;
  onCancel: () => void;
};

/**
 * Escribir o editar la reseña de una entrada del Diario (tocar el
 * icono de la pluma en una fila de DiaryTab.tsx). Guardar con el
 * campo vacío borra la reseña.
 */
export default function EditReviewDialog({
  title,
  initial,
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initial ?? "");

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
        aria-label={`Tu reseña de ${title}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-6 py-6 text-center shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
      >
        <p className="marquee-font text-xl text-white">
          Tu reseña de <span className="text-zinc-300">{title}</span>
        </p>

        <label className="mt-4 block text-left">
          <span className="sr-only">Reseña</span>
          <textarea
            value={value}
            maxLength={MAX_LENGTH}
            onChange={(event) => setValue(event.target.value)}
            rows={5}
            placeholder="¿Qué te ha parecido? Unas líneas bastan…"
            autoFocus
            className="w-full resize-none rounded-xl border border-zinc-700/80 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
