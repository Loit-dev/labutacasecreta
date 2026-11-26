"use client";

import { useEffect, useRef, useState } from "react";

import { fetchYearRank, type YearRank } from "@/lib/supabase/summary";

/**
 * Comparativa con el resto de la app ("Mejor que el X% de la
 * comunidad"), para el Resumen Anual: bajo demanda, igual que
 * useWrappedTrendy/useWrappedCastHighlights — una sola llamada RPC
 * (my_year_rank, supabase/resumen.sql) que solo devuelve un percentil
 * y un total de cuentas, nunca datos de nadie más. `null` si la
 * función todavía no existe en Supabase o si algo falla: el Resumen
 * se ve igual, solo sin esta comparativa.
 */
export function useWrappedYearRank(year: number): {
  yearRank: YearRank | null;
  loading: boolean;
} {
  const [yearRank, setYearRank] = useState<YearRank | null>(null);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function run() {
      setLoading(true);

      const result = await fetchYearRank(year);

      if (cancelledRef.current) return;

      setYearRank(result);
      setLoading(false);
    }

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [year]);

  return { yearRank, loading };
}
