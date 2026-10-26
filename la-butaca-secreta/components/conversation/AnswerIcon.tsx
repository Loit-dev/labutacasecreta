import type { ComponentType } from "react";

import {
  BanIcon,
  BoltIcon,
  BrainIcon,
  CheersIcon,
  ClapperIcon,
  DiceIcon,
  FamilyIcon,
  GemIcon,
  GhostIcon,
  HeartIcon,
  LaughIcon,
  LeafIcon,
  MasksIcon,
  PersonIcon,
  RocketIcon,
  SearchIcon,
  SparkleIcon,
  StarFilledIcon,
  SurpriseIcon,
  SwirlIcon,
  TensionIcon,
  ThumbsUpIcon,
  TvIcon,
} from "@/components/icons/Icons";

type IconProps = { size?: number; className?: string };

// Mapa emoji -> icono para las opciones del cuestionario
// (data/conversation/nodes.ts): cada label empieza por uno de estos
// emoji seguido de un espacio y el resto del texto. splitAnswerLabel
// separa ambas partes para poder pintar el icono SVG en vez del emoji
// de datos, sin tener que tocar nodes.ts.
const ANSWER_ICONS: Record<string, ComponentType<IconProps>> = {
  "🎬": ClapperIcon,
  "📺": TvIcon,
  "🙋": PersonIcon,
  "❤️": HeartIcon,
  "🍻": CheersIcon,
  "👨‍👩‍👧": FamilyIcon,
  "😂": LaughIcon,
  "😰": TensionIcon,
  "🤯": BrainIcon,
  "🚀": RocketIcon,
  "😲": SurpriseIcon,
  "🎲": DiceIcon,
  "💥": BoltIcon,
  "🕵️": SearchIcon,
  "😱": GhostIcon,
  "🎭": MasksIcon,
  "🍥": SwirlIcon,
  "🚫": BanIcon,
  "👍": ThumbsUpIcon,
  "🆕": SparkleIcon,
  "⭐": StarFilledIcon,
  "🧠": BrainIcon,
  "😌": LeafIcon,
  "💎": GemIcon,
};

/**
 * Separa el emoji inicial (si lo reconocemos) del resto del texto de
 * una opción del cuestionario. Si el emoji no está en el mapa (o no
 * hay emoji), devuelve el texto completo sin icono: así una opción
 * nueva sin icono todavía no rompe nada, solo se queda sin icono.
 */
export function splitAnswerLabel(label: string): {
  Icon: ComponentType<IconProps> | null;
  text: string;
} {
  const spaceIndex = label.indexOf(" ");
  if (spaceIndex === -1) return { Icon: null, text: label };

  const prefix = label.slice(0, spaceIndex);
  const Icon = ANSWER_ICONS[prefix];

  return Icon
    ? { Icon, text: label.slice(spaceIndex + 1) }
    : { Icon: null, text: label };
}
