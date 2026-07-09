export default function Header() {
  return (
    <header className="text-center">
      <h1
        className="
          mx-auto
          mt-4
          max-w-4xl
          text-4xl
          font-extrabold
          tracking-tight
          leading-none
          text-white
          sm:text-5xl
        "
        style={{
          fontFamily: "var(--font-manrope)",
        }}
      >
        Descubre historias increíbles
        <br />

        <span className="text-white">
          hechas{" "}
        </span>

        <span
          className="
            bg-gradient-to-r
            from-red-800
            via-red-700
            to-orange-600
            bg-clip-text
            text-transparent
          "
        >
          para ti.
        </span>
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
        Responde unas preguntas y encontraré lo que mejor encaja contigo.
      </p>
    </header>
  );
}