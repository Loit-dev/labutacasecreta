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
      <div className="absolute inset-0 grid grid-cols-3 gap-2 scale-150 opacity-30 blur-3xl">
        {posters.map((poster) => (
          <div
            key={poster}
            className="relative h-screen w-full"
          >
            {poster}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-black/70" />

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
    </div>
  );
}
