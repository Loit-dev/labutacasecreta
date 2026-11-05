"use client";

import { SEASONAL_ACHIEVEMENTS } from "@/lib/achievements/catalog";
import type { SeasonalProgress } from "@/lib/achievements/compute";
import AchievementIcon from "./AchievementIcon";

// Color propio para lo estacional, deliberadamente distinto de los 5
// de nivel (Bronce/Plata/Oro/Platino/Diamante) y del naranja de Beta
// tester: un estacional conseguido no es un "nivel", es un evento de
// tiempo limitado, así que no debía confundirse visualmente con Oro.
export const SEASONAL_STYLE = {
  background: "linear-gradient(135deg, #6ee7b7, #0d9488)",
  border: "rgba(45,212,191,0.55)",
  color: "#042f2e",
  shadow: "rgba(45,212,191,0.35)",
  labelColor: "#2dd4bf",
};

function daysUntilWindowEnd(endMonth: number, endDay: number, now: Date): number {
  let end = new Date(now.getFullYear(), endMonth - 1, endDay, 23, 59, 59);

  if (end.getTime() < now.getTime()) {
    end = new Date(now.getFullYear() + 1, endMonth - 1, endDay, 23, 59, 59);
  }

  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

/**
 * Banner de evento estacional con cuenta atrás, reutilizable para
 * Navideño/Terrorífico/Flechazo. Solo se muestra el que está dentro
 * de su ventana de fechas y aún no conseguido — fiel a
 * MejorasEngagement.dc.html.
 */
export default function SeasonalBanner({ seasonal }: { seasonal: SeasonalProgress[] }) {
  const now = new Date();

  const active = SEASONAL_ACHIEVEMENTS.map((def) => {
    const progress = seasonal.find((p) => p.key === def.key);
    return { def, progress };
  }).find(({ progress }) => progress?.windowOpen && !progress.unlocked);

  if (!active) return null;

  const { def } = active;
  const daysLeft = daysUntilWindowEnd(def.window.endMonth, def.window.endDay, now);

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-3.5 py-3"
      style={{ background: "linear-gradient(135deg, #061e1a, #072420)", borderColor: "rgba(45,212,191,0.3)" }}
    >
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: SEASONAL_STYLE.background, color: SEASONAL_STYLE.color }}
      >
        <AchievementIcon icon={def.icon} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold">{def.name}</div>
        <div className="mt-0.5 text-[11px] text-zinc-400">{def.condition}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-black" style={{ color: SEASONAL_STYLE.labelColor }}>
          {daysLeft} {daysLeft === 1 ? "día" : "días"}
        </div>
        <div className="text-[9px] text-zinc-500">quedan</div>
      </div>
    </div>
  );
}
