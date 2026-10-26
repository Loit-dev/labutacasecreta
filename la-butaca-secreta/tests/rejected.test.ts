import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_REJECTED,
  REJECTED_EVENT,
  addRejected,
  clearRejected,
  countRejected,
  parseRejected,
  readRejectedList,
  removeRejected,
} from "@/lib/rejected";

let events: string[] = [];

function installFakeStorage() {
  const data = new Map<string, string>();

  events = [];

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
    dispatchEvent: (event: Event) => {
      events.push(event.type);
      return true;
    },
  };

  return data;
}

const item = (id: number, type: "movie" | "tv" = "movie") => ({
  id,
  type,
  title: `Título ${id}`,
  year: 2020,
  rating: 6.5,
  poster: "https://image.tmdb.org/t/p/w500/abc.jpg",
});

describe("Descartadas", () => {
  let data: Map<string, string>;

  beforeEach(() => {
    data = installFakeStorage();
  });

  test("empieza vacía", () => {
    assert.deepEqual(readRejectedList(), []);
    assert.equal(countRejected(), 0);
  });

  test("guarda y lee, con lo más reciente primero", () => {
    addRejected(item(1));
    addRejected(item(2));

    assert.deepEqual(
      readRejectedList().map((i) => i.id),
      [2, 1]
    );
    assert.equal(countRejected(), 2);
  });

  test("no repite: volver a descartar lo sube al principio", () => {
    addRejected(item(1));
    addRejected(item(2));
    addRejected(item(1));

    assert.deepEqual(
      readRejectedList().map((i) => i.id),
      [1, 2]
    );
  });

  test("una película y una serie con el mismo id son distintas", () => {
    addRejected(item(5, "movie"));
    addRejected(item(5, "tv"));

    assert.equal(readRejectedList().length, 2);

    removeRejected(5, "movie");

    const left = readRejectedList();
    assert.equal(left.length, 1);
    assert.equal(left[0].type, "tv");
  });

  test("avisa de los cambios", () => {
    addRejected(item(1));
    removeRejected(1, "movie");
    clearRejected();

    assert.deepEqual(events, [
      REJECTED_EVENT,
      REJECTED_EVENT,
      REJECTED_EVENT,
    ]);
  });

  test("guarda como mucho MAX_REJECTED", () => {
    for (let id = 1; id <= MAX_REJECTED + 20; id++) {
      addRejected(item(id));
    }

    const list = readRejectedList();

    assert.equal(list.length, MAX_REJECTED);
    assert.equal(list[0].id, MAX_REJECTED + 20);
  });

  test("datos corruptos, inválidos o del formato antiguo no rompen nada", () => {
    data.set("lbs:rejected:v2", "{no es json");
    assert.deepEqual(readRejectedList(), []);

    // Formato antiguo: solo números, sin título ni póster
    data.set("lbs:rejected:movie", JSON.stringify([1, 2, 3]));
    assert.equal(countRejected(), 0);

    data.set(
      "lbs:rejected:v2",
      JSON.stringify([
        item(1),
        { id: -3, type: "movie", title: "x" },
        { id: 2, type: "otro", title: "x" },
        { id: 3, type: "tv", title: "   " },
        4,
        "texto",
        null,
      ])
    );

    assert.deepEqual(
      readRejectedList().map((i) => i.id),
      [1]
    );
  });

  test("sin localStorage disponible, funciona igual", () => {
    (globalThis as unknown as { window: unknown }).window = {
      get localStorage() {
        throw new Error("bloqueado");
      },
    };

    assert.deepEqual(readRejectedList(), []);
    assert.doesNotThrow(() => addRejected(item(1)));
    assert.doesNotThrow(() => removeRejected(1, "movie"));
    assert.doesNotThrow(() => clearRejected());
  });

  test("parseRejected acepta lo que se guardó", () => {
    addRejected(item(7, "tv"));

    const [saved] = parseRejected(data.get("lbs:rejected:v2") ?? null);

    assert.equal(saved.title, "Título 7");
    assert.equal(saved.type, "tv");
    assert.equal(saved.poster, "https://image.tmdb.org/t/p/w500/abc.jpg");
  });
});
