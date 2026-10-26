import Image from "next/image";

import BadgeIcon from "./BadgeIcon";
import { BulbIcon } from "@/components/icons/Icons";

// Iconos propios en vez de emoji para la nota y las acciones (ver
// DECISIONS.md, "Tarjeta de recomendación enriquecida").
function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#facc15" aria-hidden="true">
      <path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.2L12 18.3 5.6 21.7 7 14.5l-5.3-5 7.2-.9z" />
    </svg>
  );
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h10a1 1 0 011 1v17l-6-3.5L6 21V4a1 1 0 011-1z"
        stroke={filled ? "#facc15" : "#d4d4d8"}
        fill={filled ? "#facc15" : "none"}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SeenIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="#4ade80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="#a1a1aa"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Props = {
  badge: string;
  badgeTitle: string;
  title: string;
  year: number;
  rating: number;
  runtime?: number;
  genres?: string[];
  overview: string;
  poster: string;
  providers?: {name: string; logo: string;}[];
  reason?: string;
  saved?: boolean;
  // Puntitos del carrusel (solo en el móvil, una tarjeta a la vez)
  dots?: { total: number; current: number };
  // Versión reducida (p.ej. Mi Resumen: 3 tarjetas una junto a otra,
  // también en móvil): póster bajo, textos más pequeños.
  compact?: boolean;
  onToggleSave?: () => void;
  onDetails?: () => void;
  onSeen?: () => void;
  onReject?: () => void;
  /**
   * Si se da, toda la portada se vuelve pulsable (encima del póster,
   * la nota, etc.) para esta acción en vez de ir a la ficha del
   * título (p.ej. "Mi Resumen": tocar la portada de la favorita para
   * cambiarla). `onDetails` (el botón "Ver") sigue llevando a la
   * ficha como siempre.
   */
  onPosterClick?: () => void;
  posterClickLabel?: string;
};

export default function RecommendationCard({
  badge,
  badgeTitle,
  title,
  year,
  rating,
  runtime,
  genres = [],
  overview,
  poster,
  providers = [],
  reason,
  saved = false,
  dots,
  compact = false,
  onToggleSave,
  onDetails,
  onSeen,
  onReject,
  onPosterClick,
  posterClickLabel,
}: Props) {
  return (
    <article
      aria-label={title}
      className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl"
    >
       <div
        className={`relative w-full overflow-hidden ${
          compact ? "h-28 sm:h-36 md:h-40" : "h-80 md:h-58"
        }`}
      >
        <Image src={poster} alt={title} fill unoptimized={poster.endsWith(".svg")} className="object-cover object-top md:object-contain md:bg-black" sizes="(max-width: 768px) 100vw, 33vw" />
        {rating > 0 && (
          <span
            className={`absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border border-amber-300/50 bg-black/70 font-bold text-white backdrop-blur-sm ${
              compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            }`}
          >
            <StarIcon />
            <span className="sr-only">Nota </span>
            {rating}
          </span>
        )}
        {dots && dots.total > 1 && (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent"
              aria-hidden="true"
            />

            <div
              className="absolute inset-x-0 top-3 flex justify-center gap-1.5"
              aria-hidden="true"
            >
              {Array.from({ length: dots.total }).map(
                (_, index) => (
                  <div
                    key={index}
                    className={
                      index === dots.current
                        ? "h-1.5 w-6 rounded-full bg-red-500 transition-all duration-300"
                        : "h-1.5 w-1.5 rounded-full bg-white/45 transition-all duration-300"
                    }
                  />
                )
              )}
            </div>
          </>
        )}
        {providers.length > 0 && !compact && (
  <button
    type="button"
    onClick={onDetails}
    aria-label={`Ver dónde está disponible: ${title}`}
    className="
      absolute
      bottom-3
      left-3
      flex
      items-center
      gap-1.5

      rounded-full

      bg-black/60

      py-2
      pl-3
      pr-2.5

      backdrop-blur-sm
      md:backdrop-blur-md
      shadow-lg
      transition-colors
      hover:bg-black/80
      focus-visible:outline-2
      focus-visible:outline-offset-2
      focus-visible:outline-white
    "
  >
    <span className="flex items-center gap-2">
      {providers.slice(0, 3).map((provider) => (
        <Image
          key={provider.name}
          src={provider.logo}
          alt={provider.name}
          width={26}
          height={26}
          className="rounded-full"
        />
      ))}
    </span>

    <span aria-hidden="true" className="text-xs text-zinc-300">
      ▸
    </span>
  </button>
)}
        {onPosterClick && (
          <button
            type="button"
            onClick={onPosterClick}
            aria-label={posterClickLabel ?? `Cambiar: ${title}`}
            className="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
          />
        )}
      </div>

      <div
        aria-hidden="true"
        className="h-px shrink-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 6px, rgba(250,246,236,0.16) 6px 8px)",
        }}
      />

      <div
        className={
          compact
            ? "flex flex-1 flex-col space-y-1 p-2"
            : "flex flex-1 flex-col space-y-2.5 p-4 md:space-y-3"
        }
      >
        <div>
          <div
            className={
              compact
                ? "marquee-font truncate text-[11px] text-yellow-400"
                : "marquee-font text-sm text-yellow-400"
            }
          >
            <span className="inline-flex -translate-y-px items-center">
              <BadgeIcon badge={badge} size={compact ? 12 : 14} className="text-yellow-400" />
            </span>{" "}
            {badgeTitle}
          </div>

          <h2
            className={
              compact
                ? "mt-1 line-clamp-2 text-xs font-bold leading-tight text-white"
                : "mt-2 line-clamp-2 text-lg font-bold text-white"
            }
          >
            {title}
          </h2>
        </div>

        <div
          className={
            compact
              ? "flex flex-wrap gap-x-2 text-[10px] text-zinc-400"
              : "flex flex-wrap gap-3 text-sm text-zinc-400"
          }
        >
          {runtime && !compact ? (
            <span>{runtime} min</span>
          ) : null}

          <span>{year}</span>
        </div>

        {genres.length > 0 && (
          <div className="hidden flex-wrap gap-2 md:flex">
            {genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {reason && (
          <p className="line-clamp-2 text-justify text-[13px] italic leading-relaxed text-yellow-200/80 md:line-clamp-none md:text-xs">
            <BulbIcon size={13} className="inline -translate-y-px" /> {reason}
          </p>
        )}

        {!compact && (
          <div className="hidden md:block">
            <p className="line-clamp-2 text-justify text-sm leading-relaxed text-zinc-300">
              {overview}
            </p>
          </div>
        )}

        <button
  onClick={onDetails}
  aria-label={`Ver detalles de ${title}`}
  className={
    compact
      ? "marquee-font mt-auto w-full rounded-md bg-red-600 px-2 py-1.5 text-xs text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      : "marquee-font mt-auto w-full rounded-md bg-red-600 px-4 py-3 text-base text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
  }
>
  {compact ? "Ver" : "Ver detalles"}
</button>

        {(onToggleSave || onSeen || onReject) && (
          <div className="flex gap-1.5">
            {onToggleSave && (
              <button
                onClick={onToggleSave}
                aria-pressed={saved}
                aria-label={
                  saved
                    ? `Guardada, quitar de mi lista: ${title}`
                    : `Guardar en mi lista: ${title}`
                }
                title="Guardar para ver luego"
                className={`flex flex-1 flex-col items-center gap-1 rounded-md border px-1 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  saved
                    ? "border-yellow-500/70 bg-yellow-400/10"
                    : "border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    saved ? "border-amber-300/50" : "border-zinc-600/50"
                  }`}
                >
                  <SaveIcon filled={saved} />
                </span>
                <span
                  className={`marquee-font text-xs ${
                    saved ? "text-yellow-300" : "text-zinc-300"
                  }`}
                >
                  {saved ? "Guardada" : "Guardar"}
                </span>
              </button>
            )}

            {onSeen && (
              <button
                onClick={onSeen}
                aria-label={`Ya la vi: ${title}`}
                title="No volveré a recomendártela"
                className="flex flex-1 flex-col items-center gap-1 rounded-md border border-dashed border-zinc-700/70 bg-zinc-800/40 px-1 py-2 transition-colors hover:border-zinc-500 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/40">
                  <SeenIcon />
                </span>
                <span className="marquee-font text-xs text-zinc-300">
                  Ya la vi
                </span>
              </button>
            )}

            {onReject && (
              <button
                onClick={onReject}
                aria-label={`No me apetece: ${title}`}
                title="Buscaré algo distinto"
                className="flex flex-1 flex-col items-center gap-1 rounded-md border border-dashed border-zinc-700/70 bg-zinc-800/40 px-1 py-2 transition-colors hover:border-zinc-500 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-600/50">
                  <RejectIcon />
                </span>
                <span className="marquee-font text-xs text-zinc-300">
                  No me apetece
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}