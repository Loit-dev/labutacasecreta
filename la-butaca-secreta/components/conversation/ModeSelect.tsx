import type { PlatformKey } from "@/lib/platforms";

import PlatformPicker from "./PlatformPicker";

export type Mode = "solo" | "group";

type Props = {
  onSelect: (mode: Mode) => void;
  platforms: PlatformKey[];
  onPlatformsChange: (next: PlatformKey[]) => void;
};

const MODES: {
  id: Mode;
  emoji: string;
  title: string;
  hint: string;
}[] = [
  {
    id: "solo",
    emoji: "🙋",
    title: "Solo",
    hint: "Unas preguntas y listo.",
  },
  {
    id: "group",
    emoji: "👥",
    title: "Acompañado",
    hint: "En pareja o en grupo. Cada uno elige y, si no coincidís, se desempata jugando.",
  },
];

export default function ModeSelect({
  onSelect,
  platforms,
  onPlatformsChange,
}: Props) {
  return (
    <div data-mode-select>
      <p
        className="text-center text-lg font-bold text-white md:text-xl"
        style={{ fontFamily: "var(--font-manrope)" }}
      >
        ¿Cómo vas a verla?
      </p>

      <div className="mt-4 grid gap-2.5 md:mt-6 md:gap-3 md:grid-cols-2">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onSelect(mode.id)}
            className="group rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-4 py-3 text-left md:px-5 md:py-5 shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl" aria-hidden="true">
                {mode.emoji}
              </span>

              <span
                className="text-base font-semibold text-white md:text-lg"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                {mode.title}
              </span>
            </span>

            <span className="mt-1 block text-xs text-zinc-400 md:mt-2 md:text-sm">
              {mode.hint}
            </span>
          </button>
        ))}
      </div>

      <PlatformPicker
        selected={platforms}
        onChange={onPlatformsChange}
      />
    </div>
  );
}
