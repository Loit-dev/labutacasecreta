"use client";

import { TvIcon } from "@/components/icons/Icons";
import {
  PLATFORMS,
  type PlatformKey,
} from "@/lib/platforms";

type Props = {
  selected: PlatformKey[];
  onChange: (next: PlatformKey[]) => void;
};

/**
 * «¿Dónde vas a verla?»: el usuario marca las plataformas que tiene y
 * solo se le recomienda lo que está en ellas. Siempre queda al menos una.
 */
export default function PlatformPicker({
  selected,
  onChange,
}: Props) {
  function toggle(key: PlatformKey) {
    const on = selected.includes(key);

    if (on && selected.length === 1) return;

    onChange(
      PLATFORMS.map((platform) => platform.key).filter(
        (k) => (k === key ? !on : selected.includes(k))
      )
    );
  }

  return (
    <div data-platform-picker className="mt-8">
      <p className="marquee-font flex items-center justify-center gap-1.5 text-center text-base text-zinc-200">
        <TvIcon size={16} /> ¿Dónde vas a verla?
      </p>

      <p className="mt-1 text-center text-xs text-zinc-400">
        Marca tus plataformas y solo te recomendaré lo que puedas ver.
      </p>

      <div
        role="group"
        aria-label="Tus plataformas"
        className="mt-3 flex flex-wrap justify-center gap-1.5 sm:gap-2"
      >
        {PLATFORMS.map((platform) => {
          const on = selected.includes(platform.key);

          return (
            <button
              key={platform.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(platform.key)}
              className={`rounded-full border px-2 py-1.5 text-xs font-semibold sm:px-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                on
                  ? "border-red-500/70 bg-red-500/15 text-white"
                  : "border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500 hover:text-white"
              }`}
            >
              <span aria-hidden="true" className="hidden sm:inline">
                {on ? "✓ " : ""}
              </span>
              {platform.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
