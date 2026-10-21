"use client";

import { useEffect, useState } from "react";

import { HANDS, rpsWinner, type Hand } from "@/lib/group";

type Props = {
  names: [string, string];
  /** Lo que defiende cada uno, por ejemplo "😂 Comedia" */
  stakes: [string, string];
  /** 0 si gana el primero, 1 si gana el segundo */
  onDone: (winner: 0 | 1) => void;
};

type Hands = [Hand | null, Hand | null];

const EMPTY: Hands = [null, null];

function emojiOf(hand: Hand) {
  return HANDS.find((h) => h.id === hand)?.emoji ?? "";
}

/**
 * Piedra, papel o tijera en una sola pantalla: cada uno toca su mitad.
 * Lo que elige cada uno no se ve hasta que han elegido los dos.
 */
export default function RpsDuel({ names, stakes, onDone }: Props) {
  const [hands, setHands] = useState<Hands>(EMPTY);
  const [tries, setTries] = useState(0);

  const [a, b] = hands;
  const result = a && b ? rpsWinner(a, b) : undefined;
  const isTie = result === null;

  // Empate: se vuelve a jugar solo
  useEffect(() => {
    if (!isTie) return;

    const timer = setTimeout(() => {
      setHands(EMPTY);
      setTries((n) => n + 1);
    }, 1800);

    return () => clearTimeout(timer);
  }, [isTie]);

  function pick(player: 0 | 1, hand: Hand) {
    setHands((current) => {
      if (current[player]) return current;

      const next: Hands = [current[0], current[1]];
      next[player] = hand;

      return next;
    });
  }

  const revealed = a !== null && b !== null;

  const decided = revealed && result !== undefined && result !== null;

  let status = "Cada uno toca su mano. No se ve hasta que elijáis los dos.";

  if (revealed && isTie) {
    status = "¡Empate! Otra vez…";
  } else if (revealed && result !== undefined && result !== null) {
    status = `¡Gana ${names[result]}!`;
  } else if (a || b) {
    status = `${a ? names[0] : names[1]} ya ha elegido. Falta ${
      a ? names[1] : names[0]
    }.`;
  }

  return (
    <div data-duel>
      <p
        role="status"
        aria-live="polite"
        className={
          decided
            ? "mt-4 text-center text-2xl font-bold text-emerald-300 md:text-3xl"
            : revealed
              ? "mt-4 text-center text-2xl font-bold text-white md:text-3xl"
              : "mt-3 text-center text-sm text-zinc-300"
        }
      >
        {status}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {([0, 1] as const).map((player) => {
          const hand = hands[player];
          const won = revealed && result === player;

          return (
            <div
              key={`${player}-${tries}`}
              className={`rounded-2xl border px-3 py-4 text-center ${
                won
                  ? "border-emerald-400/60 bg-emerald-500/10"
                  : "border-white/10 bg-black/30"
              }`}
            >
              <p className="truncate text-base font-bold text-white">
                {names[player]}
              </p>

              <p className="mt-1 truncate text-xs text-zinc-400">
                Defiende: {stakes[player]}
              </p>

              {revealed && hand ? (
                <p
                  className="mt-4 text-6xl"
                  aria-label={`${names[player]} eligió ${
                    HANDS.find((h) => h.id === hand)?.label
                  }`}
                >
                  {emojiOf(hand)}
                </p>
              ) : hand ? (
                <p className="mt-4 text-lg font-semibold text-emerald-300">
                  ✔ Listo
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {HANDS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={`${names[player]}: ${option.label}`}
                      onClick={() => pick(player, option.id)}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-3xl transition hover:border-red-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <span aria-hidden="true">{option.emoji}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {revealed && result !== undefined && result !== null && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => onDone(result)}
            className="rounded-xl bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Seguir
          </button>
        </div>
      )}
    </div>
  );
}
