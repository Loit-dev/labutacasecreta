/**
 * Mismos emojis que usa el cuestionario para "¿Qué te apetece ver?"
 * (data/conversation/nodes.ts), ampliado con el resto de géneros de
 * TMDb que no aparecen ahí pero sí pueden venir guardados en
 * `watched.genres` (lib/supabase/watched.ts guarda el nombre tal
 * cual lo da TMDb en español, que a veces difiere del nombre que usa
 * el resto de la web: TMDb llama "Suspense" al género 53, mientras
 * que aquí se muestra como "Thriller" — se cubren ambos).
 */
export const GENRE_EMOJI: Record<string, string> = {
  "Ciencia ficción": "🚀",
  Acción: "💥",
  Aventura: "🧭",
  Thriller: "🕵️",
  Suspense: "🕵️",
  Comedia: "😂",
  Terror: "😱",
  Drama: "🎭",
  Romance: "❤️",
  Familia: "👨‍👩‍👧",
  Anime: "🍥",
  Animación: "🎨",
  Crimen: "🔫",
  Documental: "🎥",
  Fantasía: "🧙",
  Historia: "📜",
  Misterio: "🔎",
  Música: "🎵",
  Bélica: "⚔️",
  Western: "🤠",
};

export function genreEmoji(name: string): string {
  return GENRE_EMOJI[name] ?? "🎬";
}
