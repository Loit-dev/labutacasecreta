"use client";

import { useEffect, useState } from "react";

import { TIER_NAMES, type AchievementFamily } from "@/lib/achievements/catalog";
import Medal, { TIER_STYLE } from "./Medal";

export type NearMiss = {
  family: AchievementFamily;
  level: number; // nivel al que se llegaría (1-5)
  value: number;
  nextThreshold: number;
};

const AUTO_DISMISS_MS = 4000;

/**
 * Snackbar no bloqueante justo tras completar una acción que cuenta
 * para un logro: "N más para Tier en Familia". Fiel a
 * MejorasEngagement.dc.html. Se dispara solo cuando falta poco
 * (ver AchievementsProvider), nunca en cada valoración.
 */
export default function ProgressToast({ nearMiss, onDone }: { nearMiss: NearMiss; onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 200);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearMiss.family.key, nearMiss.level]);

  const missing = nearMiss.nextThreshold - nearMiss.value;
  const prevThreshold = nearMiss.level > 1 ? nearMiss.family.thresholds[nearMiss.level - 2] : 0;
  const pct = Math.min(
    100,
    Math.round(((nearMiss.value - prevThreshold) / (nearMiss.nextThreshold - prevThreshold)) * 100)
  );
  const style = TIER_STYLE[nearMiss.level as 1 | 2 | 3 | 4 | 5];

  function close() {
    setVisible(false);
    setTimeout(onDone, 150);
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="flex max-w-sm items-center gap-3 rounded-xl border-l-[3px] border border-white/10 bg-zinc-900/95 px-3.5 py-3 shadow-2xl backdrop-blur"
        style={{ borderLeftColor: style.labelColor }}
      >
        <Medal icon={nearMiss.family.icon} tier={nearMiss.level as 1 | 2 | 3 | 4 | 5} size={30} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-white">
            {missing} {missing === 1 ? "más" : "más"} para{" "}
            <span style={{ color: style.labelColor }}>{TIER_NAMES[nearMiss.level - 1]}</span> en{" "}
            {nearMiss.family.name}
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: style.background }} />
          </div>
        </div>
        <button type="button" onClick={close} aria-label="Cerrar" className="flex-shrink-0 text-zinc-500">
          ✕
        </button>
      </div>
    </div>
  );
}
