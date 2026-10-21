export default function Header() {
  return (
    <header className="text-center">
      <h1
        className="
          mx-auto
          mt-1
          max-w-4xl
          text-3xl
          font-extrabold
          tracking-tight
          leading-none
          text-white
          sm:mt-4
          sm:text-5xl
        "
        style={{
          fontFamily: "var(--font-manrope)",
        }}
      >
        Descubre historias
        <br />
        <span className="text-white">
          hechas{" "}
        </span>
        <span className="bg-gradient-to-r from-red-800 via-red-700 to-orange-600 bg-clip-text text-transparent">
          para ti.
        </span>
      </h1>

      <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400 sm:mt-4 sm:text-lg">
        Cuéntame qué te apetece y encontraré algo para ti.
      </p>
    </header>
  );
}