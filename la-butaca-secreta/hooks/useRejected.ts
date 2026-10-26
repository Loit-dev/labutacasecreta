"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  REJECTED_EVENT,
  clearRejected,
  parseRejected,
  readRejectedRaw,
  removeRejected,
  type RejectedItem,
} from "@/lib/rejected";

function subscribe(callback: () => void) {
  window.addEventListener(REJECTED_EVENT, callback);

  // Cambios hechos desde otra pestaña
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(REJECTED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * «Descartadas» (No me apetece) como estado de React: se actualiza
 * sola al quitar un título o al descartar uno nuevo, también desde
 * otra pestaña.
 */
export function useRejected() {
  const raw = useSyncExternalStore(subscribe, readRejectedRaw, () => "[]");

  const items = useMemo(
    () => parseRejected(raw).slice().reverse(),
    [raw]
  );

  const remove = useCallback(
    (id: number, type: RejectedItem["type"]) => removeRejected(id, type),
    []
  );

  return {
    items,
    count: items.length,
    remove,
    clear: clearRejected,
  };
}
