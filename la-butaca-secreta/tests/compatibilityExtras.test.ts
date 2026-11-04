import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { pickSharedPerson, type TitleCredits } from "@/lib/compatibilityExtras";

function credits(director: string | null, cast: string[]): TitleCredits {
  return { director, cast };
}

describe("pickSharedPerson", () => {
  test("elige un director que se repite en al menos 2 títulos", () => {
    const result = pickSharedPerson([
      credits("Pedro Almodóvar", ["Penélope Cruz"]),
      credits("Pedro Almodóvar", ["Antonio Banderas"]),
      credits("Otro director", []),
    ]);

    assert.deepEqual(result, { name: "Pedro Almodóvar", role: "director" });
  });

  test("si no hay director repetido, elige el actor que más se repite", () => {
    const result = pickSharedPerson([
      credits("Director A", ["Penélope Cruz", "Javier Bardem"]),
      credits("Director B", ["Penélope Cruz"]),
      credits("Director C", ["Javier Bardem"]),
    ]);

    // Penélope Cruz y Javier Bardem aparecen 2 veces cada uno: con
    // el mismo recuento, gana el primero que aparece ordenado por
    // inserción (Penélope Cruz, visto en el primer título).
    assert.equal(result?.role, "actor");
    assert.equal(result?.name, "Penélope Cruz");
  });

  test("un director pesa más que un actor en común", () => {
    const result = pickSharedPerson([
      credits("Director X", ["Actor Z"]),
      credits("Director X", ["Actor Z"]),
    ]);

    assert.deepEqual(result, { name: "Director X", role: "director" });
  });

  test("devuelve null si nadie se repite en 2 o más títulos", () => {
    const result = pickSharedPerson([
      credits("Director A", ["Actor 1"]),
      credits("Director B", ["Actor 2"]),
    ]);

    assert.equal(result, null);
  });

  test("devuelve null con una lista vacía", () => {
    assert.equal(pickSharedPerson([]), null);
  });
});
