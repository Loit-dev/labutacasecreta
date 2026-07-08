import Image from "next/image";

const posters = [
  "/posters/dune.jpg",
  "/posters/dark.jpg",
  "/posters/interstellar.jpg",
  "/posters/thebear.jpg",
  "/posters/lastofus.jpg",
  "/posters/shogun.jpg",
];

export default function CinemaBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Posters */}
      <div className="absolute inset-0 grid grid-cols-3 gap-4 scale-125 opacity-25 blur-3xl">
        {posters.map((poster) => (
          <div
            key={poster}
            className="relative h-full min-h-[500px] w-full"
          >
            {poster}
          </div>
        ))}
      </div>

      {/* Oscurecer */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Viñeta */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
    </div>
  );
}