"use client";

import { familyByKey } from "@/lib/achievements/catalog";
import type { AchievementsState } from "@/lib/achievements/compute";
import Medal from "./Medal";

type Props = {
  state: AchievementsState;
  onOpenFull: () => void;
};

const SHOWCASE_SIZE = 8;

/** Fila de logros del perfil: ancho completo, más pequeños. Fiel a Main.dc.html. */
export default function ProfileAchievementsRow({ state, onOpenFull }: Props) {
  const all = [...state.general, ...state.genero].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.value - a.value;
  });

  const unlocked = all.filter((p) => p.level > 0).slice(0, SHOWCASE_SIZE - 1);
  const lockedPool = all.filter((p) => p.level === 0);
  const showcase = [...unlocked, ...lockedPool.slice(0, SHOWCASE_SIZE - unlocked.length)];

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Logros</span>
        <button
          type="button"
          onClick={onOpenFull}
          className="text-xs font-semibold text-zinc-300 transition-colors hover:text-white"
        >
          Ver todos
        </button>
      </div>
      <div className="flex justify-between">
        {showcase.map((p) => {
          const family = familyByKey(p.key);
          if (!family) return null;

          return (
            <div key={p.key} className="flex w-[38px] flex-col items-center gap-1 text-center">
              <Medal icon={family.icon} tier={p.level as 0 | 1 | 2 | 3 | 4 | 5} size={28} />
              <span className="w-full truncate text-[6.5px] font-semibold leading-tight text-zinc-400">
                {family.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
