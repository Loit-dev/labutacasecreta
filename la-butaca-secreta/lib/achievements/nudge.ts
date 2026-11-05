/**
 * Elige, como mucho, UN aviso de logros para mostrar en la bandeja de
 * notificaciones (lib/supabase/notifications.ts no tiene push real a
 * un móvil con la app cerrada — ver nota en claude/sistema-logros.md:
 * esto adapta la misma idea a la bandeja en la propia app, que es la
 * única que existe hoy). Prioridad: evento con cuenta atrás > racha en
 * riesgo > casi-logro. Pensado para llamarse como mucho 1 vez al día
 * (ver lib/achievementNudgeSeen.ts), cálculo puro sin React/Supabase.
 */

import { SEASONAL_ACHIEVEMENTS, familyByKey } from "./catalog";
import type { AchievementsState } from "./compute";

export type AchievementNudge =
  | { type: "event"; key: string; name: string; daysLeft: number }
  | { type: "streak_risk"; days: number }
  | { type: "near"; key: string; name: string; missing: number; nextTierName: string };

const RACHA_MIN_DAYS = 7;
const NEAR_MISS_GAP = 1;

function daysUntilWindowEnd(endMonth: number, endDay: number, now: Date): number {
  let end = new Date(now.getFullYear(), endMonth - 1, endDay, 23, 59, 59);
  if (end.getTime() < now.getTime()) {
    end = new Date(now.getFullYear() + 1, endMonth - 1, endDay, 23, 59, 59);
  }
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

export function pickAchievementNudge(
  state: AchievementsState,
  now: Date = new Date()
): AchievementNudge | null {
  // 1) Evento con cuenta atrás: solo en los últimos 7 días de la
  // ventana y aún sin conseguir (igual que los 2 avisos documentados:
  // "quedan 7 días" / "último día").
  for (const def of SEASONAL_ACHIEVEMENTS) {
    const progress = state.seasonal.find((p) => p.key === def.key);
    if (!progress?.windowOpen || progress.unlocked) continue;

    const daysLeft = daysUntilWindowEnd(def.window.endMonth, def.window.endDay, now);
    if (daysLeft <= 7) {
      return { type: "event", key: def.key, name: def.name, daysLeft };
    }
  }

  // 2) Racha en riesgo: solo si ya lleva ≥7 días (perder una racha de
  // 1-2 días no le importa a nadie).
  const racha = state.general.find((p) => p.key === "racha");
  if (racha && racha.value >= RACHA_MIN_DAYS) {
    return { type: "streak_risk", days: racha.value };
  }

  // 3) Casi-logro: el gap más pequeño (≤1) entre todas las familias,
  // generales y de género.
  let best: { key: string; name: string; missing: number; nextLevel: number } | null = null;

  for (const p of [...state.general, ...state.genero]) {
    if (p.nextThreshold === undefined) continue;
    const missing = p.nextThreshold - p.value;
    if (missing > NEAR_MISS_GAP || missing <= 0) continue;
    const family = familyByKey(p.key);
    if (!family) continue;
    if (!best || missing < best.missing) {
      best = { key: p.key, name: family.name, missing, nextLevel: p.level + 1 };
    }
  }

  if (best) {
    return {
      type: "near",
      key: best.key,
      name: best.name,
      missing: best.missing,
      nextTierName: ["Bronce", "Plata", "Oro", "Platino", "Diamante"][best.nextLevel - 1],
    };
  }

  return null;
}
