export default function Header() {
  return (
    <header className="text-center">
      <div className="inline-flex items-center gap-3 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2">
        <span className="text-xl">🎬</span>

        <span className="font-semibold tracking-wide uppercase text-red-300">
          La Butaca Secreta
        </span>
      </div>

      <h1
        className="
          mt-8
          mx-auto
          max-w-4xl
          text-4xl
          font-extrabold
          tracking-tight
          text-white
          sm:text-5xl
        "
        style={{
          fontFamily: "var(--font-manrope)",
        }}
      >
        Descubre historias increíbles hechas{" "}
        <span
          className="
            bg-gradient-to-r
            from-violet-200
            via-blue-200
            to-cyan-200
            bg-clip-text
            text-transparent
          "
        >
          para ti.
        </span>
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400">
        Responde unas preguntas y encontraré lo que mejor encaja contigo.
      </p>
    </header>
  );
}