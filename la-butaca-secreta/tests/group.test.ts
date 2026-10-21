import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  buildGroupProfile,
  cleanNames,
  companyFor,
  compatibility,
  compatibilityText,
  mergeRestrictions,
  resolveRound,
  rpsWinner,
  tally,
  type Round,
} from "@/lib/group";

function round(
  id: Round["id"],
  kind: Round["kind"],
  winner: string
): Round {
  return { id, picks: [winner], kind, winner };
}

describe("votación del grupo", () => {
  test("si todos eligen lo mismo, coinciden", () => {
    const outcome = resolveRound(["comedy", "comedy", "comedy"]);

    assert.equal(outcome.kind, "unanimous");
    assert.equal(outcome.winner, "comedy");
  });

  test("con más de dos personas gana la mayoría", () => {
    const outcome = resolveRound(["comedy", "drama", "comedy"]);

    assert.equal(outcome.kind, "majority");
    assert.equal(outcome.winner, "comedy");
    assert.deepEqual(outcome.contenders, []);
  });

  test("dos personas que no coinciden empatan", () => {
    const outcome = resolveRound(["comedy", "drama"]);

    assert.equal(outcome.kind, "tie");
    assert.equal(outcome.winner, null);
    assert.deepEqual(outcome.contenders, [0, 1]);
  });

  test("en un empate 2-2 se enfrenta un representante por opción", () => {
    const outcome = resolveRound(["a", "b", "a", "b"]);

    assert.equal(outcome.kind, "tie");
    assert.deepEqual(outcome.contenders, [0, 1]);
  });

  test("en un empate a tres bandas hay tres contendientes", () => {
    const outcome = resolveRound(["a", "b", "c"]);

    assert.deepEqual(outcome.contenders, [0, 1, 2]);
  });

  test("un empate no incluye a quien votó una opción menos votada", () => {
    const outcome = resolveRound(["a", "b", "a", "b", "c"]);

    assert.deepEqual(outcome.contenders, [0, 1]);
  });

  test("tally cuenta los votos", () => {
    assert.deepEqual([...tally(["a", "b", "a"])], [
      ["a", 2],
      ["b", 1],
    ]);
  });
});

describe("piedra, papel o tijera", () => {
  test("gana quien corresponde", () => {
    assert.equal(rpsWinner("rock", "scissors"), 0);
    assert.equal(rpsWinner("scissors", "rock"), 1);
    assert.equal(rpsWinner("paper", "rock"), 0);
    assert.equal(rpsWinner("rock", "paper"), 1);
    assert.equal(rpsWinner("scissors", "paper"), 0);
    assert.equal(rpsWinner("paper", "scissors"), 1);
  });

  test("lo mismo es empate", () => {
    assert.equal(rpsWinner("rock", "rock"), null);
    assert.equal(rpsWinner("paper", "paper"), null);
    assert.equal(rpsWinner("scissors", "scissors"), null);
  });
});

describe("compatibilidad", () => {
  test("es el porcentaje de preguntas con acuerdo total", () => {
    const rounds = [
      round("mood", "unanimous", "laugh"),
      round("preferredGenre", "duel", "comedy"),
      round("contentType", "majority", "movie"),
      round("freshness", "unanimous", "any"),
    ];

    assert.equal(compatibility(rounds), 50);
  });

  test("sin preguntas es 0", () => {
    assert.equal(compatibility([]), 0);
  });

  test("el texto cambia según el porcentaje y el tamaño del grupo", () => {
    assert.match(compatibilityText(100, 2), /^Vosotros/);
    assert.match(compatibilityText(100, 4), /^El grupo/);
    assert.notEqual(
      compatibilityText(100, 2),
      compatibilityText(0, 2)
    );
  });
});

describe("restricciones y perfil", () => {
  test("lo que evita cualquiera se evita para todos, sin repetir", () => {
    assert.deepEqual(
      mergeRestrictions([["terror"], ["violence"], ["terror"], ["none"]]).sort(),
      ["terror", "violence"]
    );
  });

  test("con 2 personas es pareja y con más, amigos", () => {
    assert.equal(companyFor(2), "partner");
    assert.equal(companyFor(3), "friends");
  });

  test("el perfil del grupo recoge las respuestas ganadoras", () => {
    const profile = buildGroupProfile(
      [
        round("contentType", "unanimous", "tv"),
        round("mood", "duel", "laugh"),
        round("preferredGenre", "majority", "comedy"),
        round("freshness", "unanimous", "new"),
      ],
      [["terror"], []],
      2
    );

    assert.deepEqual(profile, {
      company: "partner",
      contentType: "tv",
      mood: "laugh",
      preferredGenre: "comedy",
      freshness: "new",
      restrictions: ["terror"],
    });
  });

  test("si nadie evita nada, las restricciones son 'none'", () => {
    const profile = buildGroupProfile([], [[], []], 3);

    assert.deepEqual(profile.restrictions, ["none"]);
    assert.equal(profile.company, "friends");
  });
});

describe("nombres", () => {
  test("los vacíos y repetidos se sustituyen por Persona N", () => {
    assert.deepEqual(cleanNames(["Ana", "", "ana"], 3), [
      "Ana",
      "Persona 2",
      "Persona 3",
    ]);
  });

  test("se recortan espacios y se limita el largo", () => {
    const [name] = cleanNames(["   Carlos    el   Grande y más  "], 1);

    assert.ok(name.length <= 14);
    assert.ok(!name.includes("  "));
  });
});
