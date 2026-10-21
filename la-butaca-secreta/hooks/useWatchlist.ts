"use client";

import {
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  LIST_EVENT,
  addToList,
  clearList,
  isSaved,
  parseList,
  readListRaw,
  removeFromList,
  type SavedItem,
  type SavedType,
} from "@/lib/watchlist";

function subscribe(callback: () => void) {
  window.addEventListener(LIST_EVENT, callback);

  // Cambios hechos desde otra pestaña
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(LIST_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * «Mi lista» como estado de React: se actualiza sola cuando se
 * guarda o se quita algo, también desde otra pestaña.
 */
export function useWatchlist() {
  const raw = useSyncExternalStore(
    subscribe,
    readListRaw,
    () => "[]"
  );

  const items = useMemo(() => parseList(raw), [raw]);

  const has = useCallback(
    (id: number, type: SavedType) => isSaved(items, id, type),
    [items]
  );

  const toggle = useCallback(
    (item: Omit<SavedItem, "savedAt">) => {
      if (isSaved(parseList(readListRaw()), item.id, item.type)) {
        removeFromList(item.id, item.type);
        return false;
      }

      addToList(item);
      return true;
    },
    []
  );

  return {
    items,
    count: items.length,
    has,
    toggle,
    remove: removeFromList,
    clear: clearList,
  };
}
