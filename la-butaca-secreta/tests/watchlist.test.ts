import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  LIST_EVENT,
  MAX_SAVED,
  addToList,
  clearList,
  isSaved,
  parseList,
  readList,
  removeFromList,
} from "@/lib/watchlist";

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
  rating: 7.5,
  poster: "https://image.tmdb.org/t/p/w500/abc.jpg",
  platforms: ["Netflix"],
});

describe("Mi lista", () => {
  let data: Map<string, string>;

  beforeEach(() => {
    data = installFakeStorage();
  });

  test("empieza vacía", () => {
    assert.deepEqual(readList(), []);
  });

  test("guarda y lee, con lo más reciente primero", () => {
    addToList(item(1));
    addToList(item(2));

    assert.deepEqual(
      readList().map((i) => i.id),
      [2, 1]
    );
  });

  test("no repite: volver a guardar lo sube al principio", () => {
    addToList(item(1));
    addToList(item(2));
    addToList(item(1));

    assert.deepEqual(
      readList().map((i) => i.id),
      [1, 2]
    );
  });

  test("una película y una serie con el mismo id son distintas", () => {
    addToList(item(5, "movie"));
    addToList(item(5, "tv"));

    const list = readList();

    assert.equal(list.length, 2);
    assert.ok(isSaved(list, 5, "movie"));
    assert.ok(isSaved(list, 5, "tv"));

    removeFromList(5, "movie");

    assert.ok(!isSaved(readList(), 5, "movie"));
    assert.ok(isSaved(readList(), 5, "tv"));
  });

  test("avisa de los cambios", () => {
    addToList(item(1));
    removeFromList(1, "movie");
    clearList();

    assert.deepEqual(events, [LIST_EVENT, LIST_EVENT, LIST_EVENT]);
  });

  test("guarda como mucho 100", () => {
    for (let id = 1; id <= MAX_SAVED + 20; id++) {
      addToList(item(id));
    }

    const list = readList();

    assert.equal(list.length, MAX_SAVED);
    assert.equal(list[0].id, MAX_SAVED + 20);
  });

  test("datos corruptos o inválidos no rompen nada", () => {
    data.set("lbs:list", "{no es json");

    assert.deepEqual(readList(), []);

    data.set(
      "lbs:list",
      JSON.stringify([
        item(1),
        { id: -3, type: "movie", title: "x" },
        { id: 2, type: "otro", title: "x" },
        { id: 3, type: "tv", title: "   " },
        { id: 4, type: "tv", title: "Bien", poster: "https://malo.example/x.jpg", platforms: [1, "Max"] },
        "texto",
        null,
      ])
    );

    const list = readList();

    assert.deepEqual(
      list.map((i) => i.id),
      [1, 4]
    );

    // Un póster de otro sitio no se acepta; las plataformas, solo texto
    assert.equal(list[1].poster, undefined);
    assert.deepEqual(list[1].platforms, ["Max"]);
  });

  test("sin localStorage disponible, funciona igual", () => {
    (globalThis as unknown as { window: unknown }).window = {
      get localStorage() {
        throw new Error("bloqueado");
      },
    };

    assert.deepEqual(readList(), []);
    assert.doesNotThrow(() => addToList(item(1)));
    assert.doesNotThrow(() => removeFromList(1, "movie"));
    assert.doesNotThrow(() => clearList());
  });

  test("parseList acepta lo que se guardó", () => {
    addToList(item(7, "tv"));

    const [saved] = parseList(data.get("lbs:list") ?? null);

    assert.equal(saved.title, "Título 7");
    assert.equal(saved.type, "tv");
    assert.deepEqual(saved.platforms, ["Netflix"]);
  });
});
