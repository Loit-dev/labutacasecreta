"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { EVENTS, type EventName } from "@/lib/analytics";
import { supabase } from "@/lib/supabase/client";
import { summarize, type UsageRow, type UsageTotal } from "@/lib/usage";

/**
 * Panel de uso (/admin/uso), solo para administradores (tabla admins).
 * Cuántas veces se ha usado cada función en los últimos 7 o 30 días,
 * comparado con el periodo anterior, y qué no ha usado nadie.
 * Datos: usage_daily (supabase/migrations/202611281200_uso.sql).
 */

const PERIODS = [7, 30] as const;

function today(): string {
  // Mismo "hoy" que la base de datos (Europe/Madrid)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(
    new Date()
  );
}

export default function UsageDashboard() {
  const { session, loading } = useAuth();
  const userId = session?.user.id ?? null;

  const [days, setDays] = useState<(typeof PERIODS)[number]>(7);
  const [rows, setRows] = useState<UsageRow[] | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId || !supabase) return;

    let cancelled = false;

    (async () => {
      const { data: admin } = await supabase!.rpc("is_admin");

      if (cancelled) return;

      if (admin !== true) {
        setAllowed(false);
        return;
      }

      setAllowed(true);

      // Dos periodos, para comparar con el anterior
      const { data } = await supabase!.rpc("usage_summary", { p_days: 60 });

      if (!cancelled) setRows((data as UsageRow[] | null) ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <p className="text-sm text-zinc-400">Cargando…</p>;

  if (!userId) {
    return (
      <p className="text-sm text-zinc-300">
        <a href="/entrar" className="text-amber-300 hover:underline">
          Entra
        </a>{" "}
        con una cuenta de administración.
      </p>
    );
  }

  if (allowed === false) {
    return <p className="text-sm text-zinc-300">Esta página es solo para administración.</p>;
  }

  if (rows === null) return <p className="text-sm text-zinc-400">Cargando…</p>;

  const totals = summarize(rows, Object.keys(EVENTS), today(), days);
  const used = totals.filter((t) => t.total > 0);
  const unused = totals.filter((t) => t.total === 0);
  const max = Math.max(1, ...used.map((t) => t.total));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="marquee-font text-3xl text-white">Uso de la web</h1>
          <p className="text-sm text-zinc-400">
            Veces que se ha usado cada función. Sin datos personales.
          </p>
        </div>

        <div className="flex rounded-full border border-white/15 p-1" role="group" aria-label="Periodo">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={days === period}
              onClick={() => setDays(period)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                days === period ? "bg-amber-300 text-black" : "text-zinc-300"
              }`}
            >
              {period} días
            </button>
          ))}
        </div>
      </div>

      {used.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Aún no hay datos en este periodo. Se empieza a contar desde que
          se activó el contador.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {used.map((total) => (
            <UsageRowView key={total.name} total={total} max={max} />
          ))}
        </ol>
      )}

      {unused.length > 0 && (
        <section className="rounded-2xl border border-dashed border-white/15 p-4">
          <h2 className="text-sm font-bold text-zinc-200">
            Sin uso en {days} días ({unused.length})
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Candidatas a revisar o quitar (si el contador lleva al menos
            ese tiempo funcionando).
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {unused.map((total) => (
              <li
                key={total.name}
                className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-300"
              >
                {EVENTS[total.name as EventName] ?? total.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function UsageRowView({ total, max }: { total: UsageTotal; max: number }) {
  const label = EVENTS[total.name as EventName] ?? total.name;
  const change =
    total.previous > 0
      ? Math.round(((total.total - total.previous) / total.previous) * 100)
      : null;
  const peak = Math.max(1, ...total.daily);

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-100">{label}</p>
        <p className="shrink-0 text-sm tabular-nums text-white">
          {total.total.toLocaleString("es-ES")}
          {change !== null && (
            <span
              className={`ml-2 text-xs ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {change >= 0 ? "+" : ""}
              {change}%
            </span>
          )}
        </p>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 to-red-500"
          style={{ width: `${(total.total / max) * 100}%` }}
        />
      </div>

      {/* Uso por día */}
      <div className="mt-2 flex h-6 items-end gap-px" aria-hidden="true">
        {total.daily.map((count, index) => (
          <div
            key={index}
            className="flex-1 rounded-sm bg-amber-300/50"
            style={{ height: `${Math.max(count > 0 ? 12 : 4, (count / peak) * 100)}%`, opacity: count > 0 ? 1 : 0.3 }}
          />
        ))}
      </div>
    </li>
  );
}
