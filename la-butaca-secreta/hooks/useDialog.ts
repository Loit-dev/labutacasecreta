"use client";

import { useEffect, useRef } from "react";

import { cycleIndex } from "@/lib/share";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento accesible de una ventana modal:
 * - lleva el foco al primer elemento al abrirse,
 * - Tab y Shift+Tab se quedan dentro de la ventana,
 * - Escape la cierra,
 * - bloquea el scroll del fondo,
 * - al cerrarse devuelve el foco a lo que lo tenía antes.
 *
 * `onClose` debe ser estable (useCallback).
 */
export function useDialog<T extends HTMLElement>(
  onClose: () => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusables = (): HTMLElement[] => {
      const node = ref.current;

      if (!node) return [];

      return Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
    };

    (focusables()[0] ?? ref.current)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const items = focusables();

      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const index = items.indexOf(
        document.activeElement as HTMLElement
      );

      const last = items.length - 1;

      // Solo hay que intervenir en los bordes (o si el foco se salió)
      if (
        index === -1 ||
        (event.shiftKey && index === 0) ||
        (!event.shiftKey && index === last)
      ) {
        event.preventDefault();

        items[
          cycleIndex(index, items.length, event.shiftKey)
        ]?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);

      document.body.style.overflow = previousOverflow;

      previousFocus?.focus();
    };
  }, [onClose]);

  return ref;
}
