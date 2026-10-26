"use client";

import { useMemo, useState } from "react";

import OptionButtons from "@/components/conversation/OptionButtons";
import Recommendations from "@/components/recommendations/Recommendations";
import { conversationNodes } from "@/data/conversation/nodes";
import { track } from "@/lib/analytics";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  VOTE_QUESTIONS,
  buildGroupProfile,
  cleanNames,
  compatibility,
  compatibilityText,
  defaultName,
  formatNames,
  INDIFFERENT,
  resolveRound,
  type Round,
  type RoundOutcome,
} from "@/lib/group";

import Panel from "./Panel";
import RpsDuel from "./RpsDuel";

// Las preguntas en las que votan todos
const QUESTIONS = VOTE_QUESTIONS;

type Step =
  | { kind: "setup" }
  | { kind: "handoff"; q: number; player: number }
  | { kind: "pick"; q: number; player: number }
  | {
      kind: "reveal";
      q: number;
      picks: string[];
      outcome: RoundOutcome;
    }
  | {
      kind: "duel";
      q: number;
      picks: string[];
      contenders: number[];
      champion: number;
      next: number;
    }
  | { kind: "summary" }
  | { kind: "results" };

type RoundView = Round & { by?: string };

function nodeOf(id: string) {
  const node = conversationNodes.find((n) => n.id === id);

  if (!node) throw new Error(`Falta la pregunta ${id}`);

  return node;
}

function labelOf(question: string, value: string) {
  return (
    nodeOf(question).options.find((o) => o.value === value)
      ?.label ?? value
  );
}

const primaryButton =
  "marquee-font rounded-md bg-red-700 px-6 py-3 text-lg text-white transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function GroupQuiz({
  platforms = "",
}: {
  platforms?: string;
}) {
  const [step, setStep] = useState<Step>({ kind: "setup" });
  const [count, setCount] = useState(MIN_PLAYERS);
  const [rawNames, setRawNames] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>([]);

  // Lo que ha elegido cada uno en la pregunta actual
  const [picks, setPicks] = useState<string[]>([]);

  const [rounds, setRounds] = useState<RoundView[]>([]);

  const profile = useMemo(() => {
    const base = buildGroupProfile(rounds, names.length);

    return platforms ? { ...base, platforms } : base;
  }, [rounds, names.length, platforms]);

  // Se calcula una sola vez para no regenerar la imagen de compartir
  const group = useMemo(
    () => ({ names, percent: compatibility(rounds) }),
    [names, rounds]
  );

  // ============================
  // Preparación
  // ============================

  function start() {
    const finalNames = cleanNames(rawNames, count);

    setNames(finalNames);
    setPicks([]);
    setRounds([]);

    track("group_started", { players: count });

    setStep({ kind: "pick", q: 0, player: 0 });
  }

  // ============================
  // Avance de preguntas
  // ============================

  function goToQuestion(q: number) {
    setPicks([]);

    if (q >= QUESTIONS.length) {
      setStep({ kind: "summary" });
      return;
    }

    setStep({ kind: "pick", q, player: 0 });
  }

  function commitRound(round: RoundView, q: number) {
    setRounds((current) => [...current, round]);

    track("group_round", {
      question: round.id,
      result: round.kind,
      value: round.winner,
    });

    goToQuestion(q + 1);
  }

  function onPick(q: number, player: number, value: string) {
    const next = [...picks, value];

    if (player + 1 < names.length) {
      setPicks(next);
      setStep({ kind: "handoff", q, player: player + 1 });
      return;
    }

    // Han elegido todos
    setPicks(next);
    setStep({
      kind: "reveal",
      q,
      picks: next,
      outcome: resolveRound(next, INDIFFERENT[QUESTIONS[q]]),
    });
  }

  // ============================
  // Pantallas
  // ============================

  if (step.kind === "setup") {
    return (
      <Panel
        eyebrow="Modo acompañado"
        title="¿Cuántos sois?"
      >
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Una persona menos"
            disabled={count <= MIN_PLAYERS}
            onClick={() => setCount((n) => n - 1)}
            className="h-11 w-11 rounded-full border border-zinc-600 bg-zinc-900 text-xl text-white disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            −
          </button>

          <p
            role="status"
            className="min-w-24 text-center text-3xl font-extrabold text-white"
          >
            {count}
          </p>

          <button
            type="button"
            aria-label="Una persona más"
            disabled={count >= MAX_PLAYERS}
            onClick={() => setCount((n) => n + 1)}
            className="h-11 w-11 rounded-full border border-zinc-600 bg-zinc-900 text-xl text-white disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            +
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Poned un nombre o un mote (si lo dejáis vacío, usaré
          “Persona 1”, “Persona 2”…). Si compartís el resultado, estos
          nombres pueden quedar en el enlace: usad un mote inventado si
          preferís no dar vuestro nombre, o elegid luego "Compartir sin
          nombres" al compartir.
        </p>

        <div className="mx-auto mt-3 grid max-w-sm gap-2">
          {Array.from({ length: count }, (_, i) => (
            <input
              key={i}
              type="text"
              maxLength={14}
              autoComplete="off"
              aria-label={`Nombre de la persona ${i + 1}`}
              placeholder={defaultName(i)}
              value={rawNames[i] ?? ""}
              onChange={(event) =>
                setRawNames((current) => {
                  const copy = [...current];
                  copy[i] = event.target.value;
                  return copy;
                })
              }
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={start}
            className={primaryButton}
          >
            Empezar
          </button>
        </div>
      </Panel>
    );
  }

  if (step.kind === "handoff") {
    const name = names[step.player];

    return (
      <Panel
        key={`handoff-${step.q}-${step.player}`}
        eyebrow="Sin mirar 🙈"
        title={`Pasa el móvil a ${name}`}
      >
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() =>
              setStep({
                kind: "pick",
                q: step.q,
                player: step.player,
              })
            }
            className={primaryButton}
          >
            Soy {name}
          </button>
        </div>
      </Panel>
    );
  }

  if (step.kind === "pick") {
    const id = QUESTIONS[step.q];
    const node = nodeOf(id);

    return (
      <Panel
        key={`pick-${step.q}-${step.player}`}
        eyebrow={`Pregunta ${step.q + 1} de ${QUESTIONS.length}`}
        title={`Turno de ${names[step.player]}`}
      >
        <p className="mt-2 text-center text-zinc-300">
          {node.title}
        </p>

        <OptionButtons
          question={node}
          onSelect={(value) => onPick(step.q, step.player, value)}
        />
      </Panel>
    );
  }

  if (step.kind === "reveal") {
    const id = QUESTIONS[step.q];
    const { outcome } = step;
    const agreed =
      outcome.kind === "unanimous" || outcome.kind === "auto";

    // A quién le da igual (su voto no cuenta)
    const shrugged = names.filter((_, i) =>
      INDIFFERENT[id].includes(step.picks[i])
    );

    const message = outcome.kind === "unanimous"
      ? names.length === 2
        ? "¡Coincidís! 🎉"
        : "¡Coincidís todos! 🎉"
      : outcome.kind === "auto"
        ? `😌 ${
            shrugged.length === 1
              ? `A ${shrugged[0]} le da igual`
              : `A ${formatNames(shrugged)} les da igual`
          }: gana ${labelOf(id, outcome.winner ?? "")}`
        : outcome.kind === "majority"
        ? `🗳️ Gana la mayoría: ${labelOf(id, outcome.winner ?? "")}`
        : "🤔 Empate… ¡piedra, papel o tijera!";

    return (
      <Panel
        key={`reveal-${step.q}`}
        eyebrow={`Pregunta ${step.q + 1} de ${QUESTIONS.length}`}
        title={message}
        tone={agreed ? "good" : "neutral"}
      >
        <ul className="mx-auto mt-5 grid max-w-md gap-2">
          {names.map((name, i) => (
            <li
              key={name}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                outcome.kind === "unanimous" ||
                step.picks[i] === outcome.winner
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-white/10 bg-black/30"
              }`}
            >
              <span className="font-semibold text-white">{name}</span>
              <span className="text-zinc-200">
                {labelOf(id, step.picks[i])}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 text-center">
          {outcome.kind === "tie" ? (
            <button
              type="button"
              onClick={() =>
                setStep({
                  kind: "duel",
                  q: step.q,
                  picks: step.picks,
                  contenders: outcome.contenders,
                  champion: outcome.contenders[0],
                  next: 1,
                })
              }
              className={primaryButton}
            >
              ¡A jugar! ✊✋✌️
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                commitRound(
                  {
                    id,
                    picks: step.picks,
                    kind: outcome.kind as "unanimous" | "majority",
                    winner: outcome.winner ?? step.picks[0],
                  },
                  step.q
                )
              }
              className={primaryButton}
            >
              Siguiente
            </button>
          )}
        </div>
      </Panel>
    );
  }

  if (step.kind === "duel") {
    const id = QUESTIONS[step.q];
    const challenger = step.contenders[step.next];

    return (
      <Panel
        key={`duel-${step.q}-${step.next}`}
        eyebrow="Desempate"
        large
        title={`${names[step.champion]} contra ${names[challenger]}`}
      >
        <RpsDuel
          names={[names[step.champion], names[challenger]]}
          stakes={[
            labelOf(id, step.picks[step.champion]),
            labelOf(id, step.picks[challenger]),
          ]}
          onDone={(winner) => {
            const survivor = winner === 0 ? step.champion : challenger;

            track("group_duel", { question: id });

            if (step.next + 1 < step.contenders.length) {
              setStep({ ...step, champion: survivor, next: step.next + 1 });
              return;
            }

            commitRound(
              {
                id,
                picks: step.picks,
                kind: "duel",
                winner: step.picks[survivor],
                by: names[survivor],
              },
              step.q
            );
          }}
        />
      </Panel>
    );
  }

  if (step.kind === "summary") {
    const percent = compatibility(rounds);

    return (
      <Panel
        key="summary"
        eyebrow={
          names.length === 2 ? "Resultado de los dos" : "Resultado del grupo"
        }
        title={`${percent} % de coincidencia`}
        tone={percent >= 75 ? "good" : "neutral"}
      >
        <p className="mt-2 text-center text-zinc-300">
          {compatibilityText(percent, names.length)}
        </p>

        <ul className="mx-auto mt-5 grid max-w-md gap-2">
          {rounds.map((round) => (
            <li
              key={round.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
            >
              <span className="text-zinc-200">
                {labelOf(round.id, round.winner)}
              </span>

              <span className="shrink-0 text-sm text-zinc-400">
                {round.kind === "unanimous" && "🟢 Coincidís"}
                {round.kind === "auto" && "😌 Sin discusión"}
                {round.kind === "majority" && "🗳️ Mayoría"}
                {round.kind === "duel" && `✊ Ganó ${round.by}`}
              </span>
            </li>
          ))}

        </ul>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              track("group_done", {
                players: names.length,
                match: percent,
              });

              setStep({ kind: "results" });
            }}
            className={primaryButton}
          >
            Ver recomendaciones
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <div className="mt-2">
      <Recommendations
        profile={profile}
        group={group}
      />
    </div>
  );
}
