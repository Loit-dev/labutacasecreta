import {
  ClapperIcon,
  EyeIcon,
  FireIcon,
  MedalIcon,
  StarFilledIcon,
  TrophyIcon,
} from "@/components/icons/Icons";

type Props = { badge: string; size?: number; className?: string };

/**
 * Las insignias (badges.ts, "Mi Resumen"...) siguen siendo un emoji
 * como dato (lo necesitan lib/shareImage.ts y lib/summaryImage.ts,
 * que dibujan en un <canvas> y no pueden usar componentes React), pero
 * en pantalla se pintan con el mismo icono dorado que el resto de la
 * web. Un badge sin icono mapeado (no debería pasar) cae de vuelta al
 * emoji en crudo, para no dejar un hueco en blanco.
 */
export default function BadgeIcon({ badge, size = 15, className = "text-amber-300" }: Props) {
  switch (badge) {
    case "🥇":
      return <MedalIcon size={size} className={className} />;
    case "🥈":
      return <MedalIcon size={size} className={className} />;
    case "🥉":
      return <MedalIcon size={size} className={className} />;
    case "🎬":
      return <ClapperIcon size={size} className={className} />;
    case "🔥":
      return <FireIcon size={size} className={className} />;
    case "⭐":
      return <StarFilledIcon size={size} className={className} />;
    case "🏆":
      return <TrophyIcon size={size} className={className} />;
    case "👁":
      return <EyeIcon size={size} className={className} />;
    default:
      return <span aria-hidden="true">{badge}</span>;
  }
}
