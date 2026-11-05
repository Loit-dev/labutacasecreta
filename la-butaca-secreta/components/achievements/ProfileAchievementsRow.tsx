"use client";

import { useState, type TouchEvent } from "react";

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

const SHOWCASE_SIZE = 8;

// En móvil se enseña una sola fila (4 insignias) por página,
// deslizando con el dedo entre páginas — en vez de las 8 insignias
// apretadas en 2 filas, que no encajaban bien con el resto de la web.
const PAGE_SIZE = 4;

const MIN_SWIPE_DISTANCE = 40;

/** Fila de logros del perfil: ancho completo, más pequeños. Fiel a Main.dc.html. */
export default function ProfileAchievementsRow({ state, onOpenFull }: Props) {
  const all = [...state.general, ...state.genero].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.value - a.value;
  });

  const unlocked = all.filter((p) => p.level > 0).slice(0, SHOWCASE_SIZE - 1);
  const lockedPool = all.filter((p) => p.level === 0);
  const showcase = [...unlocked, ...lockedPool.slice(0, SHOWCASE_SIZE - unlocked.length)];

  const pages: AchievementProgress[][] = [];
  for (let i = 0; i < showcase.length; i += PAGE_SIZE) {
    pages.push(showcase.slice(i, i + PAGE_SIZE));
  }

  const [page, setPage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const current = Math.min(page, Math.max(pages.length - 1, 0));

  function handleTouchStart(event: TouchEvent) {
    setTouchEnd(null);
    setTouchStart(event.targetTouches[0].clientX);
  }

  function handleTouchMove(event: TouchEvent) {
    setTouchEnd(event.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;

    if (distance > MIN_SWIPE_DISTANCE && current < pages.length - 1) {
      setPage(current + 1);
    }

    if (distance < -MIN_SWIPE_DISTANCE && current > 0) {
      setPage(current - 1);
    }
  }

  function renderBadge(p: AchievementProgress) {
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
  }

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

      {/* Móvil: una fila por página, deslizando con el dedo. */}
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label="Insignias de logros"
        className="sm:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {(pages[current] ?? []).map(renderBadge)}
        </div>

        {pages.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
            {pages.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === current ? "w-4 bg-amber-300" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tablet/escritorio: las 8 insignias caben en una sola fila. */}
      <div className="hidden sm:grid sm:grid-cols-8 sm:gap-x-2 sm:gap-y-4">
        {showcase.map(renderBadge)}
      </div>
    </div>
  );
}
