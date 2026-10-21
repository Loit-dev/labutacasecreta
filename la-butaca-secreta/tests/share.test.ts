import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  POSTER_PATH,
  buildShareText,
  cycleIndex,
  posterSource,
} from "@/lib/share";
import { wrapLines } from "@/lib/shareImage";

// Mide como si cada letra ocupara 10
const measure = (text: string) => text.length * 10;

describe("posterSource", () => {
  test("los pósters de TMDb pasan por nuestro servidor", () => {
    assert.equal(
      posterSource("https://image.tmdb.org/t/p/w500/abc123_X-y.jpg"),
      "/api/poster?p=%2Fabc123_X-y.jpg"
    );
  });

  test("las imágenes locales se dejan como están", () => {
    assert.equal(
      posterSource("/placeholder-poster.svg"),
      "/placeholder-poster.svg"
    );
  });

  test("cualquier otra cosa se ignora", () => {
    assert.equal(posterSource(undefined), undefined);
    assert.equal(posterSource("https://malo.example/x.jpg"), undefined);
    assert.equal(
      posterSource("https://image.tmdb.org/t/p/w500/../../etc.jpg"),
      undefined
    );
  });
});

describe("POSTER_PATH", () => {
  test("acepta rutas con forma de póster", () => {
    assert.ok(POSTER_PATH.test("/kqjL17yufvn9OVLyXYpvtyrFfak.jpg"));
    assert.ok(POSTER_PATH.test("/abcde.png"));
  });

  test("rechaza lo que podría salirse de la carpeta o apuntar a otro sitio", () => {
    for (const bad of [
      "",
      "abc.jpg",
      "/../secreto.jpg",
      "/a/b/c.jpg",
      "//evil.com/x.jpg",
      "/abc.jpg?x=1",
      "/abc.jpg#x",
      "/abcde.svg",
      "/ab.jpg",
    ]) {
      assert.ok(!POSTER_PATH.test(bad), bad);
    }
  });
});

describe("buildShareText", () => {
  test("incluye los títulos y la web", () => {
    const text = buildShareText(["A", "B", "C"], "movie");

    assert.ok(text.includes("películas"));
    assert.ok(text.includes("A, B, C"));
    assert.ok(text.includes("https://"));
  });

  test("en series habla de series", () => {
    assert.ok(buildShareText(["A"], "tv").includes("series"));
  });

  test("sin títulos, sigue teniendo sentido", () => {
    assert.ok(buildShareText([], "movie").includes("La Butaca Secreta"));
  });
});

describe("cycleIndex", () => {
  test("da la vuelta al llegar al final o al principio", () => {
    assert.equal(cycleIndex(2, 3, false), 0);
    assert.equal(cycleIndex(0, 3, true), 2);
    assert.equal(cycleIndex(0, 3, false), 1);
    assert.equal(cycleIndex(2, 3, true), 1);
  });

  test("si el foco está fuera de la lista, entra por el borde correcto", () => {
    assert.equal(cycleIndex(-1, 3, false), 0);
    assert.equal(cycleIndex(-1, 3, true), 2);
  });

  test("sin elementos no hay a dónde ir", () => {
    assert.equal(cycleIndex(0, 0, false), -1);
  });
});

describe("wrapLines", () => {
  test("un título corto va en una línea", () => {
    assert.deepEqual(wrapLines(measure, "Alien", 300, 2), ["Alien"]);
  });

  test("un título largo se reparte en dos líneas", () => {
    assert.deepEqual(
      wrapLines(measure, "El Señor de los Anillos", 130, 2),
      ["El Señor de", "los Anillos"]
    );
  });

  test("si no cabe en dos líneas, acaba en puntos suspensivos", () => {
    const lines = wrapLines(
      measure,
      "Una historia larguísima que no cabe en dos líneas de ninguna manera",
      130,
      2
    );

    assert.equal(lines.length, 2);
    assert.ok(lines[1].endsWith("…"));
    assert.ok(lines.every((line) => measure(line) <= 130));
  });

  test("una palabra enorme se recorta", () => {
    const [line] = wrapLines(measure, "Supercalifragilisticoespialidoso", 100, 2);

    assert.ok(line.endsWith("…"));
    assert.ok(measure(line) <= 100);
  });

  test("texto vacío, sin líneas", () => {
    assert.deepEqual(wrapLines(measure, "   ", 100, 2), []);
  });
});
