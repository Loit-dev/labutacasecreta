/**
 * Analítica sin cookies.
 *
 * - Visitas: Vercel Web Analytics (components/layout/Analytics.tsx).
 * - Eventos propios: se envían a Vercel (que solo los registra en los
 *   planes de pago) y además se cuentan en Supabase (usage_daily, ver
 *   supabase/migrations/202611281200_uso.sql): solo cuántas veces al día
 *   se usa cada cosa. Se ven en /admin/uso.
 * - Nunca se envían datos personales: solo respuestas del cuestionario,
 *   identificadores de títulos y contadores.
 * - Si el script no está (Analytics desactivado, bloqueador de anuncios,
 *   desarrollo), `track` no hace nada y nunca rompe la web.
 */

/** Eventos propios y su nombre legible (panel /admin/uso). */
export const EVENTS = {
  answer: "Respuesta del cuestionario",
  answer_back: "Volver atrás en el cuestionario",
  quiz_completed: "Cuestionario terminado",
  results_shown: "Recomendaciones mostradas",
  results_error: "Error al recomendar",
  results_exhausted: "Sin más recomendaciones",
  more_clicked: "Pedir más",
  seen_clicked: "Ya la vi",
  reject_clicked: "No me interesa",
  forget_seen: "Olvidar vistas",
  forget_affinity: "Olvidar gustos",
  details_open: "Abrir detalles",
  trailer_open: "Ver tráiler",
  share_open: "Abrir compartir",
  share_done: "Compartido",
  list_add: "Guardar en mi lista",
  list_remove: "Quitar de mi lista",
  list_open: "Abrir mi lista",
  calendar_open: "Pestaña Calendario",
  share_link_copy: "Copiar enlace",
  share_link_open: "Abrir enlace compartido",
  mode_selected: "Elegir modo (solo/grupo/exprés)",
  group_started: "Grupo: empezar",
  group_round: "Grupo: ronda",
  group_duel: "Grupo: desempate",
  group_done: "Grupo: terminado",
  today_shown: "Página Hoy",
  search_query: "Búsqueda",
  search_result_click: "Abrir resultado de búsqueda",
  search_open: "Pestaña Buscar",
  lists_open: "Pestaña Listas",
  instagram_click: "Clic en Instagram",
  summary_open: "Abrir Mi resumen",
  summary_no_data: "Mi resumen sin datos",
} as const;

export type EventName = keyof typeof EVENTS;

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

    countUsage(name);
  } catch {
    // La analítica nunca debe romper la web
  }
}

/** Suma 1 al contador del día en Supabase. Nunca falla en voz alta. */
function countUsage(name: EventName) {
  import("@/lib/supabase/client")
    .then(({ supabase }) => supabase?.rpc("track_usage", { p_name: name }))
    .catch(() => {});
}
