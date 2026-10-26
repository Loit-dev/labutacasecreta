import Link from "next/link";
import type { ReactElement } from "react";

import type { PlatformKey } from "@/lib/platforms";

import PlatformPicker from "./PlatformPicker";

export type Mode = "solo" | "group";

type Props = {
  onSelect: (mode: Mode) => void;
  platforms: PlatformKey[];
  onPlatformsChange: (next: PlatformKey[]) => void;
};

// Iconos propios en vez de emoji: mismo significado, trazo consistente
// con el resto de la interfaz (ver DECISIONS.md, "Inicio más visual").
function SoloIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="#fb7185" strokeWidth="1.8" />
      <path
        d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2"
        stroke="#fb7185"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8" r="2.8" stroke="#fb923c" strokeWidth="1.8" />
      <circle cx="16" cy="9.5" r="2.4" stroke="#fb923c" strokeWidth="1.8" />
      <path
        d="M3 19c0-3 2.6-5.2 5.8-5.2S14.6 16 14.6 19"
        stroke="#fb923c"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15.8 13.6c2.6.2 4.4 2.1 4.4 4.8"
        stroke="#fb923c"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExpresIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#f87171" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MODES: {
  id: Mode;
  icon: () => ReactElement;
  iconBg: string;
  title: string;
  hint: string;
}[] = [
  {
    id: "solo",
    icon: SoloIcon,
    iconBg: "bg-rose-500/15",
    title: "Solo",
    hint: "Unas preguntas y listo.",
  },
  {
    id: "group",
    icon: GroupIcon,
    iconBg: "bg-orange-500/15",
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
        className="text-center text-xl font-bold text-white"
        style={{ fontFamily: "var(--font-manrope)" }}
      >
        ¿Cómo vas a verla?
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {MODES.map((mode) => {
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className="group flex items-center gap-3.5 rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-5 py-5 text-left shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${mode.iconBg}`}
              >
                <Icon />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className="block text-lg font-semibold text-white"
                  style={{ fontFamily: "var(--font-manrope)" }}
                >
                  {mode.title}
                </span>

                <span className="mt-1 block text-sm text-zinc-400">
                  {mode.hint}
                </span>
              </span>

              <ChevronIcon />
            </button>
          );
        })}
      </div>

      <Link
        href="/hoy"
        className="group mt-3 flex items-center gap-3.5 rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/40 via-black to-zinc-950 px-5 py-5 text-left shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/70 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
          <ExpresIcon />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className="block text-lg font-semibold text-white"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            Butaca Exprés
          </span>

          <span className="mt-1 block text-sm text-zinc-400">
            Sin preguntas: 3 propuestas al momento.
          </span>
        </span>

        <ChevronIcon />
      </Link>

      <PlatformPicker
        selected={platforms}
        onChange={onPlatformsChange}
      />
    </div>
  );
}
