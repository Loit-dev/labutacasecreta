"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";
import type { Rating } from "@/lib/rating";

type Props = {
  title: string;
  onConfirm: (rating: Rating | undefined) => void;
};

/**
 * "¿Qué te pareció?" al marcar "Ya la vi". Opcional: se puede cerrar
 * sin puntuar. La valoración final se enseña siempre como ⭐ + número
 * (lib/rating.ts, components/recommendations/DetailsModal.tsx), no
 * como esta fila de estrellas, que es solo el selector.
 */
export default function RatingPrompt({ title, onConfirm }: Props) {
  const [selected, setSelected] = useState<Rating | null>(null);

  const close = () => onConfirm(selected ?? undefined);

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
        aria-label={`Valorar ${title}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-6 py-6 text-center shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
      >
        <p className="text-base font-bold text-white">
          ¿Qué te pareció <span className="text-zinc-300">{title}</span>?
        </p>

        <div
          role="radiogroup"
          aria-label="Valoración de 1 a 5 estrellas"
          className="mt-4 flex justify-center gap-2 text-3xl"
        >
          {([1, 2, 3, 4, 5] as Rating[]).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected === value}
              aria-label={`${value} estrella${value > 1 ? "s" : ""}`}
              onClick={() => setSelected(value)}
              className="transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{
                filter:
                  selected !== null && value <= selected
                    ? "none"
                    : "grayscale(1) opacity(0.35)",
              }}
            >
              ⭐
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Puedes marcarla como vista sin puntuar
        </p>

        <button
          type="button"
          onClick={close}
          className="mt-4 w-full rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {selected ? "Guardar valoración" : "Marcar como vista"}
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
