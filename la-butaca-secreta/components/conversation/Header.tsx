export default function Header() {
  return (
    <header className="text-center">
      <h1
        className="
          marquee-font
          mx-auto
          mt-1
          max-w-4xl
          text-4xl
          leading-none
          text-white
          sm:mt-4
          sm:text-6xl
        "
      >
        Tu sesión
        <br />
        <span className="bg-gradient-to-r from-amber-300 via-red-500 to-red-700 bg-clip-text text-transparent">
          empieza aquí.
        </span>
      </h1>

      <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400 sm:mt-4 sm:text-lg">
        Elige tu entrada. Nosotros apagamos las luces.
      </p>
    </header>
  );
}