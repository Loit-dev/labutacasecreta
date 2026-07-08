const posters = [
  "/posters/dune.jpg",
  "/posters/dark.jpg",
  "/posters/interstellar.jpg",
  "/posters/thebear.jpg",
  "/posters/lastofus.jpg",
  "/posters/shogun.jpg",
  "/posters/dune.jpg",
  "/posters/dark.jpg",
  "/posters/interstellar.jpg",
  "/posters/thebear.jpg",
  "/posters/lastofus.jpg",
  "/posters/shogun.jpg",
];

export default function CinemaBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 grid grid-cols-6 gap-4 scale-110">
        {posters.map((poster, index) => (
          <div
            key={index}
            className="h-screen bg-cover bg-center"
            style={{
              backgroundImage: `url(${poster})`,
              filter: "blur(10px)",
              opacity: 0.18,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-black/70" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 25%, rgba(0,0,0,.75) 100%)",
        }}
      />
    </div>
  );
}