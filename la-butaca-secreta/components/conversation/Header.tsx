export default function Header() {
  return (
    <header className="text-center">
      <div className="inline-flex items-center gap-3 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2">
        <span className="text-xl">🎬</span>

        <span className="font-semibold tracking-wide text-red-300 uppercase">
          La Butaca Secreta
        </span>
      </div>

      <h1 className="mt-6 text-4xl font-black tracking-tight text-white">
        Descubre historias increíbles hechas para ti.
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
        Responde unas preguntas y encontraré lo que mejor encajan contigo.
      </p>
    </header>
  );
}