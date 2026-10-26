import type { ComponentType } from "react";

import {
  BanIcon,
  BoltIcon,
  BrainIcon,
  CameraIcon,
  CheersIcon,
  ClapperIcon,
  CompassIcon,
  CowboyHatIcon,
  CrimeIcon,
  DiceIcon,
  FamilyIcon,
  GemIcon,
  GhostIcon,
  HeartIcon,
  LaughIcon,
  LeafIcon,
  MasksIcon,
  MusicNoteIcon,
  PaletteIcon,
  PersonIcon,
  RocketIcon,
  ScrollIcon,
  SearchIcon,
  SparkleIcon,
  StarFilledIcon,
  SurpriseIcon,
  SwirlIcon,
  SwordsIcon,
  TensionIcon,
  ThumbsUpIcon,
  TvIcon,
  WizardHatIcon,
} from "@/components/icons/Icons";

type IconProps = { size?: number; className?: string };

// Mapa emoji -> icono. Cubre tanto las opciones del cuestionario
// (data/conversation/nodes.ts, donde cada label empieza por uno de
// estos emoji seguido de un espacio) como los géneros de
// lib/genreEmoji.ts. Mismo mapa para los dos porque varios emoji se
// repiten entre preguntas y géneros (🚀, 💥, 🕵️, 😂, 😱, 🎭, ❤️...).
const EMOJI_ICONS: Record<string, ComponentType<IconProps>> = {
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
  "🧭": CompassIcon,
  "🎨": PaletteIcon,
  "🔫": CrimeIcon,
  "🎥": CameraIcon,
  "🧙": WizardHatIcon,
  "📜": ScrollIcon,
  "🔎": SearchIcon,
  "🎵": MusicNoteIcon,
  "⚔️": SwordsIcon,
  "🤠": CowboyHatIcon,
};

/** Icono para un emoji suelto (p. ej. el de lib/genreEmoji.ts), o null si no lo tenemos mapeado. */
export function emojiIcon(emoji: string): ComponentType<IconProps> | null {
  return EMOJI_ICONS[emoji] ?? null;
}

/**
 * Separa el emoji inicial (si lo reconocemos) del resto de un texto
 * que empieza por "<emoji> <texto>" — las opciones del cuestionario,
 * el eco de la respuesta elegida en el chat y el título de alguna
 * pregunta. Si el emoji no está en el mapa (o no hay emoji), se
 * devuelve el texto completo sin icono: así un texto nuevo sin icono
 * todavía no rompe nada, solo se queda sin icono.
 */
export function splitAnswerLabel(label: string): {
  Icon: ComponentType<IconProps> | null;
  text: string;
} {
  const spaceIndex = label.indexOf(" ");
  if (spaceIndex === -1) return { Icon: null, text: label };

  const prefix = label.slice(0, spaceIndex);
  const Icon = emojiIcon(prefix);

  return Icon
    ? { Icon, text: label.slice(spaceIndex + 1) }
    : { Icon: null, text: label };
}
