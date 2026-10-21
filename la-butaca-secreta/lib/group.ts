/**
 * Modo "acompañado": varias personas contestan la misma pregunta y
 * entre todos salen un único perfil.
 *
 * - Si todos eligen lo mismo, esa es la respuesta ("coincidís").
 * - Si alguien contesta "me da igual" (o "sorpréndeme"), no cuenta: gana
 *   lo que hayan elegido los demás.
 * - Si hay una opción con más votos que las demás, gana la mayoría.
 * - Si hay empate, se desempata con piedra, papel o tijera.
 *
 * Todo esto es lógica pura (sin React) para poder probarla.
 */

import type { UserProfile } from "@/lib/conversation/types";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

/** Preguntas en las que votan todos (y que se pueden desempatar). */
export const VOTE_QUESTIONS = [
  "contentType",
  "mood",
  "preferredGenre",
  "freshness",
] as const;

export type VoteQuestion = (typeof VOTE_QUESTIONS)[number];

/**
 * Respuestas que significan "lo que decidan los demás".
 * Si alguien las elige, su voto no cuenta.
 */
export const INDIFFERENT: Record<VoteQuestion, readonly string[]> = {
  contentType: [],
  mood: ["anything", "surprise"],
  preferredGenre: [],
  freshness: ["any"],
};

export type Hand = "rock" | "paper" | "scissors";

export const HANDS: { id: Hand; emoji: string; label: string }[] = [
  { id: "rock", emoji: "✊", label: "Piedra" },
  { id: "paper", emoji: "✋", label: "Papel" },
  { id: "scissors", emoji: "✌️", label: "Tijera" },
];

export type RoundKind =
  | "unanimous"
  | "auto"
  | "majority"
  | "duel";

export interface RoundOutcome {
  kind: RoundKind | "tie";
  /** Valor ganador, si ya se sabe (no hace falta desempatar) */
  winner: string | null;
  /**
   * Si hay empate: un jugador por cada opción empatada, en orden, para
   * enfrentarlos en eliminatoria.
   */
  contenders: number[];
}

/** Nombre por defecto de cada persona: "Persona 1", "Persona 2"... */
export function defaultName(index: number) {
  return `Persona ${index + 1}`;
}

/** Quita espacios, limita el largo y rellena los huecos. */
export function cleanNames(names: string[], count: number) {
  const used = new Set<string>();

  return Array.from({ length: count }, (_, i) => {
    let name = (names[i] ?? "").replace(/\s+/g, " ").trim().slice(0, 14);

    if (!name || used.has(name.toLowerCase())) {
      name = defaultName(i);
    }

    used.add(name.toLowerCase());

    return name;
  });
}

/** Cuenta los votos de cada opción. */
export function tally(picks: string[]) {
  const counts = new Map<string, number>();

  for (const pick of picks) {
    counts.set(pick, (counts.get(pick) ?? 0) + 1);
  }

  return counts;
}

/** ¿Hay un ganador claro, o hay que desempatar? */
export function resolveRound(
  picks: string[],
  indifferent: readonly string[] = []
): RoundOutcome {
  const decisive = picks.filter((pick) => !indifferent.includes(pick));

  // Todos han dicho "me da igual": vale cualquiera, gana lo más votado
  if (decisive.length === 0) {
    const counts = tally(picks);

    const [winner] = [...counts.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      kind: counts.size === 1 ? "unanimous" : "auto",
      winner,
      contenders: [],
    };
  }

  const counts = tally(decisive);

  // Los que no pasan están de acuerdo; a los demás les da igual
  if (counts.size === 1) {
    return {
      kind:
        decisive.length === picks.length ? "unanimous" : "auto",
      winner: decisive[0],
      contenders: [],
    };
  }

  const best = Math.max(...counts.values());

  const top = [...counts.entries()]
    .filter(([, n]) => n === best)
    .map(([value]) => value);

  if (top.length === 1) {
    return { kind: "majority", winner: top[0], contenders: [] };
  }

  // Un representante por cada opción empatada
  const contenders = top.map((value) => picks.indexOf(value));

  return { kind: "tie", winner: null, contenders };
}

/** Piedra, papel o tijera: 0 gana el primero, 1 el segundo, null empate. */
export function rpsWinner(a: Hand, b: Hand): 0 | 1 | null {
  if (a === b) return null;

  const beats: Record<Hand, Hand> = {
    rock: "scissors",
    scissors: "paper",
    paper: "rock",
  };

  return beats[a] === b ? 0 : 1;
}

export interface Round {
  id: VoteQuestion;
  /** Qué eligió cada persona (valor) */
  picks: string[];
  kind: RoundKind;
  winner: string;
}

/** Porcentaje de preguntas en las que nadie tuvo que ceder. */
export function compatibility(rounds: Round[]) {
  if (rounds.length === 0) return 0;

  const agreed = rounds.filter(
    (round) => round.kind === "unanimous" || round.kind === "auto"
  ).length;

  return Math.round((agreed / rounds.length) * 100);
}

/** Frase para el marcador, según el porcentaje. */
export function compatibilityText(percent: number, size: number) {
  const group = size === 2 ? "Vosotros" : "El grupo";

  if (percent >= 100) return `${group}: misma onda total 🤝`;
  if (percent >= 75) return `${group}: casi gemelos 🎯`;
  if (percent >= 50) return `${group}: media naranja… o casi 🍊`;
  if (percent >= 25) return `${group}: opuestos que se atraen 🧲`;

  return `${group}: ¡ni una! Menos mal que hay trato 😅`;
}

/** "Ana", "Ana y Luis", "Ana, Luis y Eva". */
export function formatNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";

  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

/** Con 2 personas es "en pareja"; con más, "con amigos". */
export function companyFor(size: number) {
  return size <= 2 ? "partner" : "friends";
}

export function buildGroupProfile(
  rounds: Round[],
  size: number
): UserProfile {
  const profile: UserProfile = {
    company: companyFor(size),
  };

  for (const round of rounds) {
    switch (round.id) {
      case "contentType":
        profile.contentType = round.winner as UserProfile["contentType"];
        break;

      case "mood":
        profile.mood = round.winner;
        break;

      case "preferredGenre":
        profile.preferredGenre = round.winner;
        break;

      case "freshness":
        profile.freshness = round.winner;
        break;
    }
  }

  return profile;
}
