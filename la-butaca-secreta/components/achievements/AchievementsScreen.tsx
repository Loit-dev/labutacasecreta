"use client";

import {
  GENERAL_FAMILIES,
  GENRE_FAMILIES,
  SEASONAL_ACHIEVEMENTS,
  TIER_NAMES,
  type AchievementFamily,
} from "@/lib/achievements/catalog";
import type { AchievementsState } from "@/lib/achievements/compute";
import AchievementIcon from "./AchievementIcon";
import Medal, { TIER_STYLE } from "./Medal";
import SeasonalBanner from "./SeasonalBanner";

function FamilyRow({
  family,
  level,
  value,
  nextThreshold,
}: {
  family: AchievementFamily;
  level: number;
  value: number;
  nextThreshold?: number;
}) {
  const locked = level === 0;
  const tierStyle = !locked ? TIER_STYLE[level as 1 | 2 | 3 | 4 | 5] : undefined;
  const prevThreshold = level > 0 ? family.thresholds[level - 1] : 0;
  const progressPct = nextThreshold
    ? Math.min(100, Math.round(((value - prevThreshold) / (nextThreshold - prevThreshold)) * 100))
    : 100;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Medal icon={family.icon} tier={level as 0 | 1 | 2 | 3 | 4 | 5} size={38} />
      <div className="min-w-0 flex-1">
        <div className={locked ? "text-sm font-semibold text-zinc-400" : "text-sm font-semibold text-white"}>
          {family.name}
        </div>
        {locked ? (
          <div className="mt-0.5 text-xs text-zinc-500">
            Sin empezar · {value} / {family.thresholds[0]}
          </div>
        ) : (
          <div className="mt-0.5 text-xs text-zinc-400">
            {family.levelNames[level - 1]} · {TIER_NAMES[level - 1]} · nivel {level} de 5
          </div>
        )}
        <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPct}%`,
              background: tierStyle ? tierStyle.background : "linear-gradient(90deg,#71717a,#52525b)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

type Props = {
  state: AchievementsState;
};

/** Pantalla "Tus logros" completa: Generales, Por género y Estacionales. Fiel a LogrosScreen.dc.html. */
export default function AchievementsScreen({ state }: Props) {
  const generalByKey = new Map(state.general.map((p) => [p.key, p]));
  const generoByKey = new Map(state.genero.map((p) => [p.key, p]));
  const seasonalByKey = new Map(state.seasonal.map((p) => [p.key, p]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-sm font-semibold text-zinc-300">Tus logros</div>
        <div className="mt-0.5 text-xs text-zinc-500">
          {state.startedCount} de {state.totalFamilies} en marcha
        </div>
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: `${Math.round((state.startedCount / state.totalFamilies) * 100)}%` }}
          />
        </div>
      </div>

      <SeasonalBanner seasonal={state.seasonal} />

      <section>
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-zinc-500">Generales</h3>
        <div className="divide-y divide-white/5">
          {GENERAL_FAMILIES.map((family) => {
            const progress = generalByKey.get(family.key);
            return (
              <FamilyRow
                key={family.key}
                family={family}
                level={progress?.level ?? 0}
                value={progress?.value ?? 0}
                nextThreshold={progress?.nextThreshold}
              />
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-zinc-500">Por género</h3>
        <div className="divide-y divide-white/5">
          {GENRE_FAMILIES.map((family) => {
            const progress = generoByKey.get(family.key);
            return (
              <FamilyRow
                key={family.key}
                family={family}
                level={progress?.level ?? 0}
                value={progress?.value ?? 0}
                nextThreshold={progress?.nextThreshold}
              />
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-zinc-500">Estacionales</h3>
        <div className="flex flex-col gap-2.5">
          {SEASONAL_ACHIEVEMENTS.map((s) => {
            const progress = seasonalByKey.get(s.key);
            const unlocked = progress?.unlocked ?? false;

            return (
              <div key={s.key} className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full border"
                  style={
                    unlocked
                      ? {
                          background: "linear-gradient(135deg, #fde68a, #f59e0b)",
                          borderColor: "rgba(245,158,11,0.55)",
                          color: "#78350f",
                        }
                      : { background: "#1f1f23", borderColor: "rgba(255,255,255,0.08)", color: "#71717a" }
                  }
                >
                  <AchievementIcon icon={s.icon} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={unlocked ? "text-sm font-semibold text-white" : "text-sm font-semibold text-zinc-400"}>
                    {s.name}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {unlocked ? "Conseguido" : "Sin empezar"} · {s.condition}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
