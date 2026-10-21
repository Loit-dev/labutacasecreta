/**
 * Un TMDb de mentira para las pruebas de interfaz.
 *
 * Lo usa el servidor de la web (variables TMDB_BASE_URL y TMDB_IMAGE_URL)
 * al abrir un enlace compartido: responde con la ficha de cualquier id
 * (salvo el 999, que no existe) y con una imagen para cualquier póster.
 */
import http from "node:http";

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

function details(kind, id) {
  const base = {
    id,
    overview: `Sinopsis de la compartida ${id}.`,
    poster_path: `/poster${id}abc.jpg`,
    backdrop_path: null,
    vote_average: 7.9,
    vote_count: 4000,
    genres: [
      { id: 35, name: "Comedia" },
      { id: 18, name: "Drama" },
    ],
    original_language: "es",
    popularity: 50,
    tagline: "",
    credits: {
      cast: [
        { id: 1, name: "Actor Uno", character: "", profile_path: null },
      ],
      crew: [
        {
          id: 2,
          name: "Directora Prueba",
          job: "Director",
          department: "Directing",
          profile_path: null,
        },
      ],
    },
    "watch/providers": {
      results: {
        ES: {
          link: "https://example.test/es",
          flatrate: [
            { provider_id: 8, provider_name: "Netflix", logo_path: "/logo.png" },
          ],
        },
      },
    },
    videos: { results: [] },
  };

  return kind === "movie"
    ? { ...base, title: `Compartida ${id}`, release_date: "2018-05-01", runtime: 105 }
    : { ...base, name: `Compartida ${id}`, first_air_date: "2018-05-01", episode_run_time: [45] };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/health") {
    res.writeHead(200).end("ok");
    return;
  }

  if (url.pathname.startsWith("/img/")) {
    res.writeHead(200, { "Content-Type": "image/png" }).end(PIXEL);
    return;
  }

  const match = /^\/3\/(movie|tv)\/(\d+)$/.exec(url.pathname);

  if (match) {
    const id = Number(match[2]);

    if (id === 999) {
      res
        .writeHead(404, { "Content-Type": "application/json" })
        .end(JSON.stringify({ status_message: "No encontrado" }));
      return;
    }

    res
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify(details(match[1], id)));
    return;
  }

  res.writeHead(404).end("no encontrado");
});

server.listen(4010, () => {
  console.log("TMDb de mentira en http://localhost:4010");
});
