import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  buildGroupProfile,
  cleanNames,
  companyFor,
  compatibility,
  compatibilityText,
  formatNames,
  INDIFFERENT,
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

  test("si a alguien le da igual, gana lo que eligió el otro", () => {
    const outcome = resolveRound(
      ["anything", "laugh"],
      INDIFFERENT.mood
    );

    assert.equal(outcome.kind, "auto");
    assert.equal(outcome.winner, "laugh");
  });

  test("«sorpréndeme» también cede ante una elección concreta", () => {
    const outcome = resolveRound(
      ["think", "surprise"],
      INDIFFERENT.mood
    );

    assert.equal(outcome.kind, "auto");
    assert.equal(outcome.winner, "think");
  });

  test("los que pasan no cuentan en la mayoría ni en el desempate", () => {
    const tied = resolveRound(
      ["laugh", "think", "anything"],
      INDIFFERENT.mood
    );

    assert.equal(tied.kind, "tie");
    assert.deepEqual(tied.contenders, [0, 1]);

    const majority = resolveRound(
      ["laugh", "laugh", "think", "anything"],
      INDIFFERENT.mood
    );

    assert.equal(majority.kind, "majority");
    assert.equal(majority.winner, "laugh");
  });

  test("si a todos les da igual, no hay desempate", () => {
    const same = resolveRound(["any", "any"], INDIFFERENT.freshness);

    assert.equal(same.kind, "unanimous");

    const mixed = resolveRound(
      ["anything", "surprise", "anything"],
      INDIFFERENT.mood
    );

    assert.equal(mixed.kind, "auto");
    assert.equal(mixed.winner, "anything");
  });

  test("sin lista de «me da igual» todo cuenta como voto", () => {
    assert.equal(resolveRound(["a", "b"]).kind, "tie");
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

  test("las preguntas en las que a alguien le da igual no cuentan como coincidencia", () => {
    const rounds = [
      round("contentType", "unanimous", "movie"),
      round("mood", "auto", "laugh"),
      round("preferredGenre", "duel", "comedy"),
      round("freshness", "auto", "new"),
    ];

    // Solo había opinión de todos en 2 preguntas y coincidieron en 1
    assert.equal(compatibility(rounds), 50);
  });

  test("si a todos les dio igual todo, no hay porcentaje", () => {
    assert.equal(
      compatibility([
        round("mood", "auto", "laugh"),
        round("freshness", "auto", "new"),
      ]),
      null
    );
  });

  test("sin preguntas no hay porcentaje", () => {
    assert.equal(compatibility([]), null);
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

describe("perfil del grupo", () => {
  test("con 2 personas es pareja y con más, amigos", () => {
    assert.equal(companyFor(2), "partner");
    assert.equal(companyFor(3), "friends");
  });

  test("el perfil recoge las respuestas ganadoras", () => {
    const profile = buildGroupProfile(
      [
        round("contentType", "unanimous", "tv"),
        round("mood", "duel", "laugh"),
        round("preferredGenre", "majority", "comedy"),
        round("freshness", "unanimous", "new"),
      ],
      2
    );

    assert.deepEqual(profile, {
      company: "partner",
      contentType: "tv",
      mood: "laugh",
      preferredGenre: "comedy",
      freshness: "new",
    });
  });

  test("con tres personas la compañía es «amigos»", () => {
    assert.equal(buildGroupProfile([], 3).company, "friends");
  });
});

describe("formatNames", () => {
  test("une los nombres como se dice en español", () => {
    assert.equal(formatNames(["Ana"]), "Ana");
    assert.equal(formatNames(["Ana", "Luis"]), "Ana y Luis");
    assert.equal(
      formatNames(["Ana", "Luis", "Eva"]),
      "Ana, Luis y Eva"
    );
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
