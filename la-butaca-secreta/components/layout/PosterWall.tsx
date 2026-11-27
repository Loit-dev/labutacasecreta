
import AfterLoad from "./AfterLoad";
import MobilePosterCanvas from "./MobilePosterCanvas";

/**
 * Fondo de la web: luces degradadas de sala de cine (focos ámbar y
 * rojos que se mueven muy despacio y un haz de proyector; estilos en
 * globals.css). Con `posters` (solo en la portada) se añaden además los
 * pósters inclinados a los lados, más tenues que antes para que no
 * compitan con los pósters de verdad de recomendaciones y listas.
 */
export default function PosterWall({ posters = false }: { posters?: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="glow-lights pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="glow-light glow-light--amber" />
        <div className="glow-light glow-light--red" />
        <div className="glow-light glow-light--crimson" />
        <div className="glow-light glow-light--beam" />
      </div>

      {posters && (
        <AfterLoad>
          <div className="opacity-45">
            {/* DESKTOP */}
            <div className="hidden lg:block">
              {/* IZQUIERDA */}
              <div className="pointer-events-none fixed left-0 top-0 h-screen w-[800px] overflow-hidden">
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
              <div className="pointer-events-none fixed right-0 top-0 h-screen w-[800px] overflow-hidden">
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

            {/* MÓVIL Y TABLET: en un canvas (ver MobilePosterCanvas) */}
            <MobilePosterCanvas />
          </div>
        </AfterLoad>
      )}

      {/* Glow cinematográfico */}
      <div className="pointer-events-none fixed inset-0 bg-black/20" />

      <div
        className="
          pointer-events-none
          fixed
          inset-0

          bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.12),transparent_60%)]
        "
      />
    </>
  );
}
