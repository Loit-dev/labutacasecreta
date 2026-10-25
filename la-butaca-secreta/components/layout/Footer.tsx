import Image from "next/image";
import Link from "next/link";
import AccountStatus from "./AccountStatus";
import InstagramIconLink from "./InstagramIconLink";
import InstallButton from "./InstallButton";

export default function Footer() {
  return (
    <footer className="relative z-30 mx-auto w-full max-w-4xl px-6 pb-8 pt-0 text-center md:pt-2 text-xs leading-relaxed text-zinc-400">
      <InstallButton />

      <div className="mb-2 flex items-center justify-center gap-3">
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="The Movie Database (TMDb)"
          className="inline-block opacity-80 transition-opacity hover:opacity-100"
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

        <InstagramIconLink />
      </div>

      <p className="text-justify">
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

      <p className="mt-1 text-justify">
        This product uses the TMDB API but is not endorsed or certified by
        TMDB. Este producto usa la API de TMDb, pero TMDb ni lo respalda ni
        lo certifica.
      </p>

      <AccountStatus />

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
