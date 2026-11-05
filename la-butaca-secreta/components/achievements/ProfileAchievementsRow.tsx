"use client";

import { familyByKey } from "@/lib/achievements/catalog";
import type { AchievementProgress } from "@/lib/achievements/compute";
import Medal from "./Medal";

type Props = {
  state: {
    general: AchievementProgress[];
    genero: AchievementProgress[];
  };
  onOpenFull: () => void;
};

// Solo 5: en móvil, 8 no cabían en una fila sin apretarse o partirse
// en dos. El resto se ve desde "Ver todos".
const SHOWCASE_SIZE = 5;

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
    <div className="rounded-3xl border border-white/20 bg-black/5 p-4 shadow-2xl backdrop-blur-sm md:bg-black/15 md:backdrop-blur-xl lg:bg-black/30 lg:backdrop-blur-2xl">
      <div className="mb-3.5 flex items-center justify-between border-b border-dashed border-white/10 pb-3">
        <span className="text-sm font-bold text-white">Logros</span>
        <button
          type="button"
          onClick={onOpenFull}
          className="text-xs font-semibold text-zinc-300 transition-colors hover:text-white"
        >
          Ver todos
        </button>
      </div>

      <div className="grid grid-cols-5 gap-x-2 gap-y-4">
        {showcase.map((p) => {
          const family = familyByKey(p.key);
          if (!family) return null;

          // Con nivel: el título propio de ese nivel ("Sin fronteras"),
          // no el nombre de la familia ("Géneros vistos") — eso último
          // ya lo dice el icono/medalla. Sin empezar: no hay título de
          // nivel todavía, así que sí hace falta el nombre de la familia.
          const label = p.level > 0 ? family.levelNames[p.level - 1] : family.name;

          return (
            <div key={p.key} className="flex flex-col items-center gap-1.5 text-center">
              <Medal icon={family.icon} tier={p.level as 0 | 1 | 2 | 3 | 4 | 5} size={40} />
              <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-zinc-300">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
