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

import {
  buildShareCode,
  parseShareCode,
  shareUrl,
} from "@/lib/shareLink";

describe("enlaces para compartir", () => {
  test("ida y vuelta", () => {
    const code = buildShareCode("tv", [
      { id: 101, role: "main" },
      { id: 202, role: "main" },
      { id: 303, role: "surprise" },
    ]);

    assert.equal(code, "tv-101m-202m-303s");

    assert.deepEqual(parseShareCode(code), {
      type: "tv",
      entries: [
        { id: 101, role: "main" },
        { id: 202, role: "main" },
        { id: 303, role: "surprise" },
      ],
    });
  });

  test("rechaza lo que no tenga forma de código", () => {
    for (const bad of [
      "",
      "movie",
      "book-1m",
      "movie-abc",
      "movie-1x",
      "movie-0m",
      "movie--1m",
      "movie-1m-",
      "movie-1234567890m",
      "movie-1m-2m-3m-4m-5m-6m-7m",
      "movie-1m;drop",
      "movie-%00m",
      "%E0%A4%A",
    ]) {
      assert.equal(parseShareCode(bad), null, bad);
    }
  });

  test("ignora títulos repetidos", () => {
    assert.deepEqual(parseShareCode("movie-5m-5m-6s")?.entries, [
      { id: 5, role: "main" },
      { id: 6, role: "surprise" },
    ]);
  });

  test("construye la dirección completa", () => {
    assert.equal(
      shareUrl("https://ejemplo.es/", "movie-1m"),
      "https://ejemplo.es/r/movie-1m"
    );
  });

  test("el texto incluye el enlace pedido", () => {
    assert.ok(
      buildShareText(["A"], "movie", "https://x.es/r/movie-1m").includes(
        "https://x.es/r/movie-1m"
      )
    );
  });

  test("para un grupo, el texto dice para quién son", () => {
    const text = buildShareText(
      ["A", "B"],
      "tv",
      "https://x.es",
      "Ana y Luis"
    );

    assert.ok(text.startsWith("Sugerencias de series para Ana y Luis"));
    assert.ok(!text.includes("Mis sugerencias"));
  });
});

describe("enlaces de grupo", () => {
  const entries = [
    { id: 101, role: "main" as const },
    { id: 202, role: "main" as const },
    { id: 303, role: "surprise" as const },
  ];

  test("ida y vuelta con nombres (también con tildes y emojis) y porcentaje", () => {
    const code = buildShareCode("movie", entries, {
      names: ["Ana", "José 🎬"],
      percent: 63,
    });

    assert.match(code, /^movie-101m-202m-303s-c63-n[0-9a-f]+$/);

    assert.deepEqual(parseShareCode(code)?.group, {
      names: ["Ana", "José 🎬"],
      percent: 63,
    });

    assert.deepEqual(parseShareCode(code)?.entries, entries);
  });

  test("los nombres se limpian y se recortan", () => {
    const code = buildShareCode("tv", entries, {
      names: ["  Ana|Luis\n", "Nombre larguísimo de verdad"],
      percent: 50,
    });

    const group = parseShareCode(code)?.group;

    assert.deepEqual(group?.names.length, 2);
    assert.ok(group?.names.every((n) => n.length <= 14));
    assert.ok(group?.names.every((n) => !/[|\n]/.test(n)));
  });

  test("el porcentaje se ajusta entre 0 y 100", () => {
    assert.match(
      buildShareCode("movie", entries, { names: ["A"], percent: 250 }),
      /-c100-/
    );
    assert.match(
      buildShareCode("movie", entries, { names: ["A"], percent: -4 }),
      /-c0-/
    );
  });

  test("un enlace sin grupo no lleva nada de grupo", () => {
    assert.equal(
      buildShareCode("movie", entries),
      "movie-101m-202m-303s"
    );
    assert.equal(parseShareCode("movie-101m-202m-303s")?.group, undefined);
  });

  test("rechaza grupos mal formados", () => {
    for (const bad of [
      "movie-1m-c101-n416e61",
      "movie-1m-c5-c6-n416e61",
      "movie-1m-c5-n416e61-n416e61",
      "movie-1m-c5-nzz",
      "movie-1m-c5-n4",
      "movie-1m-c5-nff",
      "movie-c5-n416e61",
    ]) {
      assert.equal(parseShareCode(bad), null, bad);
    }
  });

  test("sin nombres: va una «a» suelta y no hay ningún nombre en el código", () => {
    const code = buildShareCode("movie", entries, {
      names: ["Ana", "Luis"],
      percent: 80,
      anonymous: true,
    });

    assert.match(code, /^movie-101m-202m-303s-c80-a$/);
    assert.ok(!code.includes("Ana"));

    assert.deepEqual(parseShareCode(code)?.group, {
      names: [],
      percent: 80,
      anonymous: true,
    });
  });

  test("el nombre no puede convertirse en otra cosa que texto", () => {
    const code = buildShareCode("movie", entries, {
      names: ["<script>alert(1)</script>"],
      percent: 10,
    });

    const [name] = parseShareCode(code)?.group?.names ?? [];

    // Es solo texto (React lo escapa al mostrarlo) y de largo limitado
    assert.ok(name.length <= 14);
  });
});
