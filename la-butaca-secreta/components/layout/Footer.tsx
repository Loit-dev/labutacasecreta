import Image from "next/image";
import Link from "next/link";
import InstallButton from "./InstallButton";

export default function Footer() {
  return (
    <footer className="relative z-30 mx-auto w-full max-w-4xl px-6 pb-8 pt-2 text-center text-xs leading-relaxed text-zinc-400">
      <InstallButton />

      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="The Movie Database (TMDb)"
        className="mb-2 inline-block opacity-80 transition-opacity hover:opacity-100"
      >
        <Image
          src="/tmdb-logo.svg"
          alt="Logo de TMDb"
          width={273}
          height={36}
          unoptimized
          className="h-4 w-auto"
        />
      </a>

      <p>
        Datos de películas y series:{" "}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:text-zinc-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          TMDb
        </a>
        {" · "}Disponibilidad en plataformas:{" "}
        <a
          href="https://www.justwatch.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:text-zinc-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          JustWatch
        </a>
      </p>

      <p className="mt-1">
        This product uses the TMDB API but is not
        endorsed or certified by TMDB.
        <br />
        Este producto usa la API de TMDb, pero TMDb ni lo
        respalda ni lo certifica.
      </p>

      <p className="mt-2">
        <Link
          href="/privacidad"
          className="underline-offset-2 hover:text-zinc-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Privacidad
        </Link>
        {" · "}
        <Link
          href="/aviso-legal"
          className="underline-offset-2 hover:text-zinc-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Aviso legal
        </Link>
      </p>
    </footer>
  );
}
