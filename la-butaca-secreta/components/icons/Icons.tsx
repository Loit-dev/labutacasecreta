// Iconos propios para sustituir a los emoji sueltos que quedaban por
// la web (ver DECISIONS.md, "Barrido de emoji → iconos"). Mismo
// lenguaje visual que components/conversation/TabIcons.tsx: trazo
// fino, sin relleno salvo detalles puntuales. A diferencia de esos,
// estos usan `currentColor` y un tamaño configurable (`size`), para
// poder reutilizarlos con el color y tamaño de cada sitio (clase de
// texto del contenedor) en vez de un dorado fijo.

type IconProps = { size?: number; className?: string };

export function ClapperIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M3 9.5l15.5-5 1.3 4-15.5 5-1.3-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3 9.5V19a1 1 0 001 1h15a1 1 0 001-1v-7.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7.5 6.3l2 3.4M12 4.8l2 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function TvIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 21.5h6M12 18.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FireIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 2.5c1 2.3-.5 3.6-1.6 4.8-1.3 1.4-2.4 2.9-2.4 5.2a4 4 0 008 0c0-1.4-.5-2.2-1.1-3 0 1.6-.8 2.4-1.5 2.9.4-2-1-3.3-1.4-5C13.6 8.6 15 7.3 15 5c1.8 1.4 3.5 4 3.5 7.5a6.5 6.5 0 01-13 0C5.5 8 8.5 4.5 12 2.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarFilledIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.2L12 18.3 5.6 21.7 7 14.5l-5.3-5 7.2-.9z" />
    </svg>
  );
}

export function TrophyIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7 4h10v5a5 5 0 01-10 0V4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 5H4a3 3 0 003 3M17 5h3a3 3 0 01-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 14v3M9 20.5h6M9.5 20.5c0-2 1-2.7 2.5-3.5 1.5.8 2.5 1.5 2.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EyeIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2 12c2-4 5.8-6.5 10-6.5S20 8 22 12c-2 4-5.8 6.5-10 6.5S4 16 2 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PinIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 2.5a5.5 5.5 0 015.5 5.5c0 4-5.5 11-5.5 11S6.5 12 6.5 8A5.5 5.5 0 0112 2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function DiscardIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CheckBadgeIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BookmarkIcon({ size = 16, filled = false, className }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7 3h10a1 1 0 011 1v17l-6-3.5L6 21V4a1 1 0 011-1z"
        stroke="currentColor"
        fill={filled ? "currentColor" : "none"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BulbIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M9 18h6M10 21h4M8 14.5A5 5 0 1116 14.5c-.8 1-1.5 1.8-1.5 3h-5c0-1.2-.7-2-1.5-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MasksIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3 6c3 0 4-2 7-2 0 4-1 7-5 7-2 0-2-2-2-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M21 6c-3 0-4-2-7-2 0 4 1 7 5 7 2 0 2-2 2-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="7.3" r=".9" fill="currentColor" />
      <circle cx="17" cy="7.3" r=".9" fill="currentColor" />
      <path d="M4 19c1.5-3 4-4 8-4s6.5 1 8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BoltIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

export function ShareIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 15V3M8 7l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RefreshIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 12a8 8 0 0113.6-5.7M20 12a8 8 0 01-13.6 5.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M17.5 3.5v3.5H14M6.5 20.5V17H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MedalIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M8 2h8l-3 7h-2L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11.5l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z" fill="currentColor" />
    </svg>
  );
}

export function SearchIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19.5 19.5l-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MailIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 6.5l8.5 7 8.5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Iconos para las respuestas del cuestionario (components/conversation/
// AnswerButton.tsx): un icono por cada emoji que llevaban las opciones
// en data/conversation/nodes.ts.

export function PersonIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 20c0-3.6 3.1-6.3 7-6.3s7 2.7 7 6.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 20.3S3.5 15 3.5 9.1C3.5 6 5.9 3.8 8.6 3.8c1.5 0 2.8.7 3.4 1.9.6-1.2 1.9-1.9 3.4-1.9 2.7 0 5.1 2.2 5.1 5.3 0 5.9-8.5 11.2-8.5 11.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function CheersIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 3.5l1.4 11.4a2 2 0 002 1.8h.2a2 2 0 002-1.8L12 3.5H5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13.5 6l1 9.2a1.8 1.8 0 001.8 1.6 1.8 1.8 0 001.8-1.6l1-9.2h-5.6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" transform="rotate(16 16.8 11.1)" />
      <path d="M8 20.5h2.5M16.6 20.5h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.3 16.7v3.8M17.6 18.7v1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FamilyIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="7.5" cy="6.5" r="2.3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="6.5" r="2.3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 20c0-3 2-5.3 4.5-5.3S12 17 12 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 20c.3-2.4 2-4.2 4-4.2s3.7 1.8 4 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LaughIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10.5h.01M16 10.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7.5 13.5c.9 2 2.6 3.2 4.5 3.2s3.6-1.2 4.5-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TensionIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 13h3.5l2-5 3 10 2.3-7.5L15 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrainIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M9.5 4.2a2.6 2.6 0 00-2.6 2.6v.3A3 3 0 005 10v.6a2.8 2.8 0 00-1 2.2 2.8 2.8 0 001.7 2.6 2.7 2.7 0 002.6 3.2h1.2V4.2H9.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M14.5 4.2a2.6 2.6 0 012.6 2.6v.3A3 3 0 0119 10v.6a2.8 2.8 0 011 2.2 2.8 2.8 0 01-1.7 2.6 2.7 2.7 0 01-2.6 3.2h-1.2V4.2h1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function RocketIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 2.8c2.6 1.9 4.2 5 4.2 8.6 0 2-.5 3.7-1.3 5.1H9.1c-.8-1.4-1.3-3.1-1.3-5.1 0-3.6 1.6-6.7 4.2-8.6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.1 16.5L7 19.2M14.9 16.5L17 19.2M10 19.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SurpriseIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21M5.6 5.6l2.3 2.3M16.1 16.1l2.3 2.3M18.4 5.6l-2.3 2.3M7.9 16.1l-2.3 2.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function DiceIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.2" cy="8.2" r="1.1" fill="currentColor" />
      <circle cx="15.8" cy="8.2" r="1.1" fill="currentColor" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
      <circle cx="8.2" cy="15.8" r="1.1" fill="currentColor" />
      <circle cx="15.8" cy="15.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function GhostIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 20V11a7 7 0 0114 0v9l-2.3-1.8L14.5 20l-2.5-1.8L9.5 20l-2.2-1.8L5 20z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 11h.01M15 11h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function SwirlIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 21a9 9 0 10-9-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 17a5 5 0 10-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 13a1 1 0 10-1-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function BanIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.3 17.7L17.7 6.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ThumbsUpIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M7.5 10.5v9H5.8a1.3 1.3 0 01-1.3-1.3v-6.4a1.3 1.3 0 011.3-1.3H7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 10.5l3.8-6.8a1.8 1.8 0 013.2 1.6l-1.1 3.4h4.3a1.8 1.8 0 011.7 2.4l-2 6.6a1.8 1.8 0 01-1.7 1.3H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function SparkleIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 3.5l1.7 5.3 5.3 1.7-5.3 1.7-1.7 5.3-1.7-5.3-5.3-1.7 5.3-1.7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18.5 16.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function LeafIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 19c7-1 13-6.2 14-14-8 0-13.5 5-14 14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 19c2-3.2 4.8-6 8.3-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GemIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 9l4.5-5.5h5L19 9l-7 11.5L5 9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 9h14M9.5 3.5L7.5 9l4.5 11.5L16.5 9l-2-5.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

// Iconos de géneros (lib/genreEmoji.ts), para "Tus géneros" en Mi
// Resumen y cualquier otro sitio que use ese mismo mapa.

export function CompassIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.8 9.2l-1.6 4.4-4.4 1.6 1.6-4.4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function PaletteIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 3.5a8.5 8 0 100 16c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a3.5 3.5 0 003.5-3.5C20.5 6.4 16.7 3.5 12 3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="7.8" r="1" fill="currentColor" />
      <circle cx="15.3" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

export function CrimeIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 12a7 7 0 1114 0 7 7 0 01-14 0z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="7" width="14" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16.5 10l5-2.5v9l-5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function WizardHatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12.3 3l5 13.5H5.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3.5 16.5h15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="13.2" cy="8.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function ScrollIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M6.5 4.5h10a2 2 0 012 2v9a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 014.5 15.5v-9a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 9.5h8M8 13h5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function MusicNoteIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M9.5 16.5V5l9-1.8v10.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="14.8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SwordsIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 20L15 9M12 4l6 2-2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 20L9 9M12 4L6 6l2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CowboyHatIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M2.5 15.5c1-2.3 4.5-3.3 9.5-3.3s8.5 1 9.5 3.3c.4.9-.3 1.8-1.3 1.6-2.4-.5-5.3-1-8.2-1s-5.8.5-8.2 1c-1 .2-1.7-.7-1.3-1.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8.5 12.2c-.6-1.6-.4-3.6.7-5.2C10.3 5.2 11.5 4.3 12 4.3s1.7.9 2.8 2.7c1.1 1.6 1.3 3.6.7 5.2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
