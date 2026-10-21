/**
 * Analítica sin cookies (Vercel Web Analytics).
 *
 * - Las visitas las cuenta el script oficial (ver components/layout/Analytics.tsx).
 * - Aquí van los eventos propios (qué se responde, qué se descarta...).
 * - Nunca se envían datos personales: solo respuestas del cuestionario,
 *   identificadores de títulos y contadores.
 * - Si el script no está (Analytics desactivado, bloqueador de anuncios,
 *   desarrollo), `track` no hace nada y nunca rompe la web.
 */

export type EventName =
  | "answer"
  | "quiz_completed"
  | "results_shown"
  | "results_error"
  | "results_exhausted"
  | "more_clicked"
  | "seen_clicked"
  | "reject_clicked"
  | "forget_seen"
  | "details_open"
  | "trailer_open"
  | "share_open"
  | "share_done"
  | "list_add"
  | "list_remove"
  | "list_open"
  | "calendar_open"
  | "share_link_copy"
  | "share_link_open"
  | "mode_selected"
  | "group_started"
  | "group_round"
  | "group_duel"
  | "group_done";

type Value = string | number | boolean;

export type EventData = Record<
  string,
  Value | null | undefined
>;

declare global {
  interface Window {
    va?: (...args: unknown[]) => void;
    vaq?: unknown[];
  }
}

const MAX_TEXT = 100;

/** Solo valores simples y de tamaño razonable, que es lo que admite Vercel. */
export function cleanData(
  data?: EventData
): Record<string, Value> | undefined {
  if (!data) return undefined;

  const clean: Record<string, Value> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      clean[key] = value.slice(0, MAX_TEXT);
    } else if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      clean[key] = value;
    } else if (typeof value === "boolean") {
      clean[key] = value;
    }
  }

  return Object.keys(clean).length > 0 ? clean : undefined;
}

export function track(name: EventName, data?: EventData) {
  try {
    if (typeof window === "undefined") return;

    // Cola de espera: si el script aún no ha cargado, los eventos
    // se guardan y se envían cuando lo haga.
    if (!window.va) {
      window.va = function (...params: unknown[]) {
        (window.vaq = window.vaq ?? []).push(params);
      };
    }

    window.va("event", { name, data: cleanData(data) });
  } catch {
    // La analítica nunca debe romper la web
  }
}
