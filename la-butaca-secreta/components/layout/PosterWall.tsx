export default function PosterWall() {
  return (
    <>
      <div className="hidden lg:block">
        {/* IZQUIERDA */}
        <div className="fixed left-0 top-0 h-screen w-[800px] pointer-events-none overflow-hidden">
          <div
            className="absolute left-[-20px] top-[-20px] h-[700px] w-[500px] rotate-[-10deg] rounded-2xl bg-cover bg-center opacity-18"
            style={{
              backgroundImage: "url('/posters/dune.jpg')",
            }}
          />

          <div
            className="absolute left-[90px] top-[620px] h-[620px] w-[450px] rotate-[6deg] rounded-2xl bg-cover bg-center opacity-15"
            style={{
              backgroundImage: "url('/posters/dark.jpg')",
            }}
          />

          <div
            className="absolute left-[10px] top-[1280px] h-[650px] w-[480px] rotate-[-6deg] rounded-2xl bg-cover bg-center opacity-16"
            style={{
              backgroundImage: "url('/posters/thebear.jpg')",
            }}
          />
        </div>

        {/* DERECHA */}
        <div className="fixed right-0 top-0 h-screen w-[800px] pointer-events-none overflow-hidden">
          <div
            className="absolute right-[-20px] top-[-20px] h-[700px] w-[500px] rotate-[10deg] rounded-2xl bg-cover bg-center opacity-18"
            style={{
              backgroundImage: "url('/posters/interstellar.jpg')",
            }}
          />

          <div
            className="absolute right-[90px] top-[620px] h-[620px] w-[450px] rotate-[-6deg] rounded-2xl bg-cover bg-center opacity-15"
            style={{
              backgroundImage: "url('/posters/lastofus.jpg')",
            }}
          />

          <div
            className="absolute right-[10px] top-[1280px] h-[650px] w-[480px] rotate-[6deg] rounded-2xl bg-cover bg-center opacity-16"
            style={{
              backgroundImage: "url('/posters/shogun.jpg')",
            }}
          />
        </div>
      </div>

      <div className="fixed inset-0 bg-black/20 pointer-events-none" />
    </>
  );
}
