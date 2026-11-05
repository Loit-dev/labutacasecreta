import { LockIcon } from "@/components/icons/Icons";
import type { IconName, Tier } from "@/lib/achievements/catalog";
import AchievementIcon from "./AchievementIcon";

// Mismos degradados/colores definidos en el mockup (Medallas.dc.html,
// LogrosScreen.dc.html, Main.dc.html) — no cambiar sin actualizar el
// Artifact de referencia.
const TIER_STYLE: Record<
  1 | 2 | 3 | 4 | 5,
  { background: string; border: string; color: string; shadow: string; labelColor: string }
> = {
  1: {
    background: "linear-gradient(135deg, #fb923c, #9a3412)",
    border: "rgba(251,146,60,0.55)",
    color: "#fff",
    shadow: "rgba(251,146,60,0.35)",
    labelColor: "#fb923c",
  },
  2: {
    background: "linear-gradient(135deg, #f4f4f5, #a1a1aa)",
    border: "rgba(228,228,231,0.55)",
    color: "#1c1917",
    shadow: "rgba(228,228,231,0.25)",
    labelColor: "#e4e4e7",
  },
  3: {
    background: "linear-gradient(135deg, #fde047, #ca8a04)",
    border: "rgba(250,204,21,0.55)",
    color: "#1c1917",
    shadow: "rgba(250,204,21,0.35)",
    labelColor: "#facc15",
  },
  4: {
    background: "linear-gradient(135deg, #f0f9ff, #7dd3fc)",
    border: "rgba(125,211,252,0.6)",
    color: "#0c4a6e",
    shadow: "rgba(125,211,252,0.4)",
    labelColor: "#7dd3fc",
  },
  5: {
    background: "linear-gradient(135deg, #f5f3ff, #c4b5fd 45%, #67e8f9 100%)",
    border: "rgba(196,181,253,0.65)",
    color: "#312e81",
    shadow: "rgba(167,139,250,0.55)",
    labelColor: "#c4b5fd",
  },
};

const LOCKED_STYLE = {
  background: "#1f1f23",
  border: "rgba(255,255,255,0.08)",
  color: "#71717a",
};

/** Gema hexagonal del nivel Diamante — fiel a Medallas.dc.html. */
function DiamondMedal({ icon, iconSize }: { icon: IconName; iconSize: number }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 68, height: 68, filter: "drop-shadow(0 4px 14px rgba(167,139,250,0.55))" }}
    >
      <svg width="68" height="68" viewBox="0 0 68 68">
        <defs>
          <linearGradient id="dia-bezel" x1="10" y1="4" x2="58" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f5f3ff" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="dia-fill" x1="13" y1="10" x2="55" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f5f3ff" />
            <stop offset="45%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#5ee9f0" />
          </linearGradient>
        </defs>
        <polygon points="34,4 59.98,19 59.98,49 34,64 8.02,49 8.02,19" fill="url(#dia-bezel)" />
        <polygon
          points="34,10 54.78,22 54.78,46 34,58 13.22,46 13.22,22"
          fill="url(#dia-fill)"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
        <g stroke="#ffffff" strokeWidth="0.6" opacity="0.5" strokeLinejoin="round">
          <line x1="34" y1="34" x2="34" y2="10" />
          <line x1="34" y1="34" x2="54.78" y2="22" />
          <line x1="34" y1="34" x2="54.78" y2="46" />
          <line x1="34" y1="34" x2="34" y2="58" />
          <line x1="34" y1="34" x2="13.22" y2="46" />
          <line x1="34" y1="34" x2="13.22" y2="22" />
        </g>
        <polygon points="34,10 34,34 13.22,22" fill="#ffffff" opacity="0.22" />
        <svg x={34 - iconSize / 2} y={34 - iconSize / 2} width={iconSize} height={iconSize} viewBox="0 0 24 24" style={{ color: "#2e1065" }}>
          <AchievementIcon icon={icon} size={iconSize} />
        </svg>
        <path d="M46 14 L47.2 17.6 L50.8 18.8 L47.2 20 L46 23.6 L44.8 20 L41.2 18.8 L44.8 17.6 Z" fill="#fff" opacity="0.95" />
        <path d="M20 48 L20.8 50.2 L23 51 L20.8 51.8 L20 54 L19.2 51.8 L17 51 L19.2 50.2 Z" fill="#fff" opacity="0.7" />
      </svg>
    </div>
  );
}

/** Medalla Beta tester — mismo círculo que las demás, degradado cálido de marca + β. */
export function BetaMedal({ size = 56 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full border-2"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #fde68a, #f97316 55%, #b91c1c)",
        borderColor: "rgba(249,115,22,0.55)",
        boxShadow: "0 4px 14px rgba(249,115,22,0.45)",
        color: "#fff",
      }}
    >
      <span
        className="font-serif italic font-bold"
        style={{ fontSize: size * 0.46, lineHeight: 1 }}
        aria-label="Beta"
      >
        β
      </span>
    </div>
  );
}

type Props = {
  icon: IconName;
  tier: Tier;
  /** Diámetro del círculo (o del lado de la gema de Diamante). */
  size?: number;
};

/** Medalla de un logro: círculo gris + candado si no empezado, color de nivel si lo tiene, gema si es Diamante. */
export default function Medal({ icon, tier, size = 56 }: Props) {
  const iconSize = Math.round(size * 0.46);

  if (tier === 0) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="flex h-full w-full items-center justify-center rounded-full border opacity-60"
          style={{ background: LOCKED_STYLE.background, borderColor: LOCKED_STYLE.border, color: LOCKED_STYLE.color }}
        >
          <AchievementIcon icon={icon} size={iconSize} />
        </div>
        <div
          className="absolute flex items-center justify-center rounded-full border"
          style={{
            width: size * 0.42,
            height: size * 0.42,
            right: -2,
            bottom: -2,
            background: "#27272a",
            borderColor: "rgba(255,255,255,0.12)",
            color: "#71717a",
          }}
        >
          <LockIcon size={Math.round(size * 0.22)} />
        </div>
      </div>
    );
  }

  if (tier === 5) {
    return <DiamondMedal icon={icon} iconSize={iconSize} />;
  }

  const style = TIER_STYLE[tier];

  return (
    <div
      className="flex items-center justify-center rounded-full border-2"
      style={{
        width: size,
        height: size,
        background: style.background,
        borderColor: style.border,
        boxShadow: `0 4px 14px ${style.shadow}`,
        color: style.color,
      }}
    >
      <AchievementIcon icon={icon} size={iconSize} />
    </div>
  );
}

export { TIER_STYLE };
