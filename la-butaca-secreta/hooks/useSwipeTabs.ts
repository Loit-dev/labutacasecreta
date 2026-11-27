"use client";

import { useRef, type TouchEvent } from "react";

const MIN_DISTANCE = 60; // px en horizontal
const MAX_SLOPE = 0.6; // |dy| / |dx|: más inclinado es hacer scroll

/**
 * Cambiar de pestaña deslizando el dedo a izquierda/derecha (como en
 * Mi cuenta). Devuelve los manejadores para el contenedor.
 *
 * No salta cuando:
 *   - el gesto es más vertical que horizontal (scroll normal);
 *   - empieza en algo que se arrastra o se escribe (campos, deslizadores)
 *     o en una fila con scroll horizontal (carruseles de pósters,
 *     plataformas…), o en un elemento con data-no-swipe;
 *   - viene de un diálogo que React pinta fuera (portal) aunque los
 *     eventos le lleguen al contenedor.
 */
export function useSwipeTabs(onSwipe: (direction: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  function blocked(target: EventTarget | null, container: Element): boolean {
    if (!(target instanceof Element) || !container.contains(target)) {
      return true;
    }

    if (
      target.closest(
        'input, textarea, select, [role="slider"], [contenteditable="true"], [data-no-swipe]'
      )
    ) {
      return true;
    }

    for (
      let node: Element | null = target;
      node && node !== container;
      node = node.parentElement
    ) {
      const overflowX = getComputedStyle(node).overflowX;

      if (
        (overflowX === "auto" || overflowX === "scroll") &&
        node.scrollWidth > node.clientWidth + 1
      ) {
        return true;
      }
    }

    return false;
  }

  return {
    onTouchStart(event: TouchEvent<HTMLElement>) {
      const touch = event.touches[0];

      start.current =
        event.touches.length === 1 && !blocked(event.target, event.currentTarget)
          ? { x: touch.clientX, y: touch.clientY }
          : null;
    },

    onTouchEnd(event: TouchEvent<HTMLElement>) {
      const from = start.current;
      start.current = null;

      if (!from) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - from.x;
      const dy = touch.clientY - from.y;

      if (Math.abs(dx) < MIN_DISTANCE) return;
      if (Math.abs(dy) > Math.abs(dx) * MAX_SLOPE) return;

      // Dedo hacia la izquierda → pestaña siguiente
      onSwipe(dx < 0 ? 1 : -1);
    },

    onTouchCancel() {
      start.current = null;
    },
  };
}
