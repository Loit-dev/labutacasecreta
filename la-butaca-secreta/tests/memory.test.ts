import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  clearMemory,
  confidentDefaults,
  hasMemory,
  inferredProfile,
  readMemory,
  recordCompletion,
} from "@/lib/memory";

function installFakeStorage() {
  const data = new Map<string, string>();

  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
    },
  };

  return data;
}

describe("Memoria entre visitas", () => {
  let data: Map<string, string>;

  beforeEach(() => {
    data = installFakeStorage();
  });

  test("empieza sin memoria", () => {
    assert.equal(hasMemory(), false);
    assert.equal(inferredProfile(), null);
    assert.deepEqual(confidentDefaults(), {
      preferredGenre: undefined,
      mood: undefined,
    });
  });

  test("una sola vez no basta para dar nada por hecho (pero sí para el perfil del modo rápido)", () => {
    recordCompletion({
      contentType: "movie",
      preferredGenre: "comedy",
      mood: "laugh",
    });

    assert.equal(hasMemory(), true);

    // Con una sola vez no hay mayoría clara: el cuestionario sigue preguntando
    assert.deepEqual(confidentDefaults(), {
      preferredGenre: undefined,
      mood: undefined,
    });

    // Pero el modo rápido, que no pregunta nada, sí usa la mejor pista que haya
    assert.equal(inferredProfile()?.preferredGenre, "comedy");
    assert.equal(inferredProfile()?.mood, "laugh");
  });

  test("tras repetirse, el cuestionario ya se puede saltar la pregunta", () => {
    recordCompletion({ preferredGenre: "thriller" });
    recordCompletion({ preferredGenre: "thriller" });

    assert.equal(confidentDefaults().preferredGenre, "thriller");
  });

  test("sin mayoría clara, el cuestionario sigue preguntando", () => {
    recordCompletion({ preferredGenre: "thriller" });
    recordCompletion({ preferredGenre: "comedy" });
    recordCompletion({ preferredGenre: "horror" });

    assert.equal(confidentDefaults().preferredGenre, undefined);

    // El modo rápido sí elige algo: el más repetido hasta ahora
    assert.ok(
      ["thriller", "comedy", "horror"].includes(
        inferredProfile()?.preferredGenre ?? ""
      )
    );
  });

  test("recuerda el último perfil completo (plataformas incluidas)", () => {
    recordCompletion({
      contentType: "tv",
      preferredGenre: "drama",
      platforms: "netflix,filmin",
    });

    const profile = inferredProfile();

    assert.equal(profile?.contentType, "tv");
    assert.equal(profile?.platforms, "netflix,filmin");
    assert.equal(profile?.company, "alone");
  });

  test("clearMemory borra todo", () => {
    recordCompletion({ preferredGenre: "drama" });
    clearMemory();

    assert.equal(hasMemory(), false);
    assert.equal(inferredProfile(), null);
  });

  test("datos corruptos no rompen nada", () => {
    data.set("lbs:memory", "{no es json");

    assert.deepEqual(readMemory().genreCounts, {});
    assert.doesNotThrow(() => recordCompletion({ preferredGenre: "drama" }));

    data.set(
      "lbs:memory",
      JSON.stringify({
        genreCounts: "no es un objeto",
        moodCounts: { laugh: -3 },
        completions: "cinco",
        lastProfile: "no es un perfil",
      })
    );

    const memory = readMemory();

    assert.deepEqual(memory.genreCounts, {});
    assert.deepEqual(memory.moodCounts, {});
    assert.equal(memory.completions, 0);
    assert.equal(memory.lastProfile, null);
  });

  test("sin localStorage disponible, funciona igual", () => {
    (globalThis as unknown as { window: unknown }).window = {
      get localStorage() {
        throw new Error("bloqueado");
      },
    };

    assert.equal(hasMemory(), false);
    assert.doesNotThrow(() => recordCompletion({ preferredGenre: "drama" }));
    assert.equal(inferredProfile(), null);
  });
});
