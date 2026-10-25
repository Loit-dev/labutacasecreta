"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";
import type { Rating } from "@/lib/rating";

type Props = {
  title: string;
  /** Para editar una valoración ya puesta: empieza con esa nota marcada. */
  initial?: Rating;
  /** true cuando se abre para cambiar una nota ya puesta (diario), no al marcar como vista por primera vez. */
  editing?: boolean;
  onConfirm: (rating: Rating | undefined) => void;
};

/**
 * "¿Qué te pareció?" al marcar "Ya la vi". Opcional: se puede cerrar
 * sin puntuar. La valoración final se enseña siempre como ⭐ + número
 * (lib/rating.ts, components/recommendations/DetailsModal.tsx), no
 * como esta fila de estrellas, que es solo el selector.
 */
// Icono de estrella (Material Symbols), en un viewBox cuadrado para
// poder recortarlo con precisión a la mitad exacta con un clipPath.
const STAR_PATH =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

export default function RatingPrompt({
  title,
  initial,
  editing = false,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<Rating | null>(initial ?? null);

  const uid = useId();

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
          aria-label="Valoración de 1 a 5 estrellas, con medias estrellas"
          className="mt-4 flex justify-center gap-1"
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const fill = Math.max(0, Math.min(1, (selected ?? 0) - (star - 1)));
            // La primera estrella no admite "media", el mínimo es 1.
            const halfValue = (star === 1 ? 1 : star - 0.5) as Rating;
            const clipId = `${uid}-star-${star}`;

            return (
              <div
                key={star}
                className="relative inline-block h-10 w-10 select-none sm:h-11 sm:w-11"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full"
                >
                  <path d={STAR_PATH} fill="#52525b" />

                  {fill > 0 && (
                    <>
                      <clipPath id={clipId}>
                        <rect x="0" y="0" width={fill * 24} height="24" />
                      </clipPath>
                      <path
                        d={STAR_PATH}
                        fill="#facc15"
                        clipPath={`url(#${clipId})`}
                      />
                    </>
                  )}
                </svg>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selected === halfValue}
                  aria-label={`${halfValue} estrella${halfValue !== 1 ? "s" : ""}`}
                  onClick={() => setSelected(halfValue)}
                  className="absolute inset-y-0 left-0 w-1/2 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                />
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected === star}
                  aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
                  onClick={() => setSelected(star as Rating)}
                  className="absolute inset-y-0 right-0 w-1/2 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                />
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Toca la mitad izquierda de una estrella para media estrella.
          {editing
            ? " Deja todas las estrellas vacías para quitar la nota."
            : " Puedes marcarla como vista sin puntuar."}
        </p>

        <button
          type="button"
          onClick={close}
          className="mt-4 w-full rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {editing ? "Guardar" : selected ? "Guardar valoración" : "Marcar como vista"}
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
