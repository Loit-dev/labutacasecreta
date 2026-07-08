export default function Header() {
  return (
   <header className="relative text-center lg:pl-36">
  <img
    src="/Logo.png"
    alt="La Butaca Secreta"
    className="absolute left-4 top-0 hidden lg:block h-24 w-auto"
  />

  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-300">
          TU GUÍA DE PELÍCULAS Y SERIES
        </span>
      </div>

      <h1
        className="mx-auto mt-8 max-w-5xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
        style={{
          fontFamily: "var(--font-manrope)",
        }}
      >
        Descubre historias increíbles hechas{" "}
        <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
          para ti.
        </span>
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
        Responde unas preguntas y encontraré lo que mejor encaja contigo.
      </p>
    </header>
  );
}