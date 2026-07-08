type Props = {
  label: string;
  onClick: () => void;
  centered?: boolean;
};

export default function AnswerButton({
  label,
  onClick,
  centered = false,
}: Props) {
  const isMovie = label.toLowerCase().includes("pel");

  return (
    <button
      onClick={onClick}
      className="
        group
        w-full
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-gradient-to-br
        from-white/[0.05]
        to-white/[0.02]
        p-8
        text-left
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-red-500/40
        hover:from-red-500/10
        hover:to-white/[0.05]
      "
    >
      <div
        className={`flex items-center ${
          centered ? "justify-center" : "justify-between"
        }`}
      >
        <div
          className={`flex items-center gap-4 ${
            centered ? "justify-center" : ""
          }`}
        >
          <span className="text-4xl">
            {isMovie ? "🎬" : "📺"}
          </span>

          <h3
            className="
              text-3xl
              font-semibold
              tracking-tight
              text-white
            "
            style={{
              fontFamily: "var(--font-manrope)",
            }}
          >
            {label
              .replace("🎬 ", "")
              .replace("📺 ", "")}
          </h3>
        </div>

        {!centered && (
          <span
            className="
              text-4xl
              text-zinc-500
              transition-all
              duration-300
              group-hover:translate-x-2
              group-hover:text-red-500
            "
          >
            →
          </span>
        )}
      </div>

      <p
        className={`mt-5 text-base text-zinc-400 ${
          centered ? "text-center" : ""
        }`}
      >
        {isMovie
          ? "Encuentra la película perfecta para esta noche."
          : "Descubre una serie que te enganche desde el primer episodio."}
      </p>
    </button>
  );
}