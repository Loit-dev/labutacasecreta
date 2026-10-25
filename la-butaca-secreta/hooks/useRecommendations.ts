"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { track } from "@/lib/analytics";
import type { UserProfile } from "@/lib/conversation/types";
import {
  readAvoidGenres,
  readBoostGenres,
  recordAvoid,
  resetGenreAffinity,
} from "@/lib/genreAffinity";
import {
  countAvailable,
  pickWindow,
} from "@/lib/recommendation/window";
import type { Recommendation } from "@/lib/tmdb/mapper";
import {
  addSeen,
  clearSeen,
  readSeen,
} from "@/lib/viewed";
import { addRejected } from "@/lib/rejected";

type Phase = "loading" | "ready" | "error";

// Cuando quedan menos títulos que esto sin mostrar, pedimos más
const LOW_STOCK = 4;

const PROFILE_KEYS = [
  "mood",
  "preferredGenre",
  "company",
  "duration",
  "pace",
  "freshness",
  "discoveryMode",
  "language",
  "animation",
  "platforms",
] as const;

function buildQuery(
  profile: UserProfile,
  extra: Record<string, string>
) {
  const params = new URLSearchParams();

  params.set(
    "type",
    profile.contentType ?? "movie"
  );

  for (const key of PROFILE_KEYS) {
    const value = profile[key];

    if (value) {
      params.set(key, value);
    }
  }

  if (profile.restrictions?.length) {
    params.set(
      "restrictions",
      profile.restrictions.join(",")
    );
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}

async function fetchBatch(
  profile: UserProfile,
  extra: Record<string, string>,
  signal: AbortSignal
): Promise<Recommendation[]> {
  const response = await fetch(
    `/api/tmdb?${buildQuery(profile, extra)}`,
    { signal }
  );

  if (!response.ok) {
    const body = await response.text();

    // La API incluye "detail" solo fuera de producción
    let detail = "";

    try {
      detail = JSON.parse(body).detail ?? "";
    } catch {}

    throw new Error(
      detail || `Error ${response.status}`
    );
  }

  const data: unknown = await response.json();

  return Array.isArray(data)
    ? (data as Recommendation[])
    : [];
}

export function useRecommendations(
  profile: UserProfile
) {
  const type = profile.contentType ?? "movie";

  const [items, setItems] = useState<
    Recommendation[]
  >([]);

  // Descartados, ya mostrados y pasados con "otras 3"
  const [hidden, setHidden] = useState<number[]>(
    []
  );

  const [phase, setPhase] =
    useState<Phase>("loading");

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [exhausted, setExhausted] =
    useState(false);

  const [errorDetail, setErrorDetail] =
    useState("");

  const [attempt, setAttempt] = useState(0);

  const [seenCount, setSeenCount] = useState(
    () => readSeen(type).length
  );

  // Copias en "ref" para usarlas dentro de funciones asíncronas
  // sin que se queden con valores antiguos.
  const itemsRef = useRef<Recommendation[]>([]);
  const hiddenRef = useRef<number[]>([]);
  const dislikedRef = useRef<number[]>([]);
  const busyRef = useRef(false);
  const controllerRef =
    useRef<AbortController | null>(null);

  const append = useCallback(
    (incoming: Recommendation[]) => {
      const known = new Set(
        itemsRef.current.map((item) => item.id)
      );

      const fresh = incoming.filter(
        (item) => !known.has(item.id)
      );

      if (fresh.length === 0) return;

      itemsRef.current = [
        ...itemsRef.current,
        ...fresh,
      ];

      setItems(itemsRef.current);
    },
    []
  );

  const hide = useCallback((ids: number[]) => {
    hiddenRef.current = Array.from(
      new Set([...hiddenRef.current, ...ids])
    );

    setHidden(hiddenRef.current);
  }, []);

  // Todo lo que no queremos volver a recibir: lo ya visto en
  // visitas anteriores y lo ya traído en esta.
  const excludeParam = useCallback(() => {
    const ids = new Set([
      ...readSeen(type),
      ...itemsRef.current.map((item) => item.id),
    ]);

    return Array.from(ids).slice(-300).join(",");
  }, [type]);

  // Géneros que han pesado de forma duradera (rechazos y valoraciones
  // bajas) más los de esta sesión, y géneros valorados bien (Fase 3:
  // lib/genreAffinity.ts).
  const affinityParams = useCallback(
    () => ({
      avoid: [
        ...readAvoidGenres(type),
        ...dislikedRef.current,
      ]
        .slice(-200)
        .join(","),

      boost: readBoostGenres(type).slice(-200).join(","),
    }),
    [type]
  );

  // ----------------------------------------------
  // Carga inicial: primero una tanda rápida y luego el resto
  // ----------------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    controllerRef.current = controller;

    itemsRef.current = [];
    hiddenRef.current = [];
    dislikedRef.current = [];
    busyRef.current = true;

    setItems([]);
    setHidden([]);
    setPhase("loading");
    setErrorDetail("");
    setExhausted(false);
    setLoadingMore(false);

    const startedAt = Date.now();

    async function load() {
      try {
        const quick = await fetchBatch(
          profile,
          {
            quick: "1",
            exclude: excludeParam(),
            ...affinityParams(),
          },
          controller.signal
        );

        if (controller.signal.aborted) return;

        append(quick);

        // Ya se puede enseñar algo mientras llega el resto
        track("results_shown", {
          type,
          count: quick.length,
          ms: Date.now() - startedAt,
        });

        setPhase("ready");
        setLoadingMore(true);

        try {
          const full = await fetchBatch(
            profile,
            { exclude: excludeParam(), ...affinityParams() },
            controller.signal
          );

          if (controller.signal.aborted) return;

          append(full);

          if (
            full.length === 0 &&
            quick.length === 0
          ) {
            setExhausted(true);
            track("results_exhausted", { type });
          }
        } catch (error) {
          if (controller.signal.aborted) return;

          // La primera tanda ya está en pantalla: no molestamos
          console.error(error);

          if (itemsRef.current.length === 0) {
            throw error;
          }

          setExhausted(true);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error(error);

        track("results_error", { type });

        setErrorDetail(
          error instanceof Error
            ? error.message
            : ""
        );

        setPhase("error");
      } finally {
        if (!controller.signal.aborted) {
          busyRef.current = false;
          setLoadingMore(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [
    profile,
    attempt,
    append,
    excludeParam,
    affinityParams,
    type,
  ]);

  // ----------------------------------------------
  // Pedir más (sin repetir nada y aprendiendo de lo rechazado)
  // ----------------------------------------------

  const loadMore = useCallback(async () => {
    if (busyRef.current) return;

    const controller = controllerRef.current;

    if (!controller || controller.signal.aborted) {
      return;
    }

    busyRef.current = true;
    setLoadingMore(true);

    try {
      const more = await fetchBatch(
        profile,
        { exclude: excludeParam(), ...affinityParams() },
        controller.signal
      );

      if (controller.signal.aborted) return;

      if (more.length === 0) {
        setExhausted(true);
        track("results_exhausted", { type });
      } else {
        append(more);
      }
    } catch (error) {
      if (controller.signal.aborted) return;

      console.error(error);

      setExhausted(true);
    } finally {
      if (!controller.signal.aborted) {
        busyRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [profile, excludeParam, affinityParams, append, type]);

  // ----------------------------------------------
  // Lo que se ve ahora
  // ----------------------------------------------

  const visible = useMemo(
    () => pickWindow(items, hidden),
    [items, hidden]
  );

  const available = useMemo(
    () => countAvailable(items, hidden),
    [items, hidden]
  );

  // Se acaban los títulos: pedimos más antes de que se note
  useEffect(() => {
    if (
      phase === "ready" &&
      !loadingMore &&
      !exhausted &&
      available < LOW_STOCK
    ) {
      void loadMore();
    }
  }, [
    phase,
    loadingMore,
    exhausted,
    available,
    loadMore,
  ]);

  // ----------------------------------------------
  // Acciones del usuario
  // ----------------------------------------------

  // "Dame otras 3": las que se ven pasan a la historia
  const next = useCallback(() => {
    track("more_clicked", { type });

    hide(visible.map((item) => item.id));
  }, [hide, visible, type]);

  // "Ya la vi": no vuelve a salir, tampoco en próximas visitas
  const markSeen = useCallback(
    (item: Recommendation) => {
      track("seen_clicked", { type, id: item.id, role: item.role });

      addSeen(type, item.id);

      setSeenCount(readSeen(type).length);

      hide([item.id]);
    },
    [type, hide]
  );

  // "No me apetece": no vuelve a salir y los títulos de sus géneros
  // puntúan un poco menos, ya de forma duradera (antes se olvidaba al
  // cerrar la pestaña)
  const reject = useCallback(
    (item: Recommendation) => {
      track("reject_clicked", { type, id: item.id, role: item.role });

      dislikedRef.current = [
        ...dislikedRef.current,
        ...item.genreIds,
      ].slice(-100);

      recordAvoid(type, item.genreIds);
      addRejected(type, item.id);

      hide([item.id]);
    },
    [hide, type]
  );

  const forgetSeen = useCallback(() => {
    track("forget_seen", { type });

    clearSeen(type);

    setSeenCount(0);
  }, [type]);

  // "Olvidar lo que he aprendido de tus gustos": los rechazos y
  // valoraciones en sí no se tocan, solo dejan de pesar en los
  // géneros de próximas búsquedas.
  const forgetAffinity = useCallback(() => {
    track("forget_affinity", { type });

    resetGenreAffinity(type);

    dislikedRef.current = [];
  }, [type]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return {
    visible,
    available,
    phase,
    loadingMore,
    exhausted,
    errorDetail,
    seenCount,
    next,
    markSeen,
    reject,
    forgetSeen,
    forgetAffinity,
    retry,
  };
}
