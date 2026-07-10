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
  const isMovie =
    label.includes("Película") ||
    label.includes("🎬");

  const isSeries =
    label.includes("Serie") ||
    label.includes("📺");

  return (
    <button
      onClick={onClick}
      className="
        group
        relative
        w-full
        min-h-[72px]
        overflow-hidden

        rounded-2xl

        border
        border-zinc-700/80

        bg-gradient-to-br
        from-zinc-900
        via-black
        to-zinc-950

        px-4
        py-3

        text-left

        shadow-[0_8px_20px_rgba(0,0,0,0.45)]

        transition-all
        duration-300

        hover:-translate-y-0.5
        hover:border-red-500/60
        hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]
      "
    >
      <div
        className="
          absolute
          inset-0

          bg-gradient-to-br
          from-white/[0.03]
          via-transparent
          to-red-500/[0.02]
        "
      />

      <div
        className="
          absolute
          inset-0

          opacity-0

          bg-gradient-to-br
          from-red-500/10
          via-transparent
          to-red-500/5

          transition-all
          duration-300

          group-hover:opacity-100
        "
      />

      <div
        className={`
          relative
          flex
          h-full
          items-center
          ${
            centered
              ? "justify-center"
              : "justify-between"
          }
        `}
      >
        <div
          className={`
            flex
            flex-1
            items-center
            gap-3

            ${
              centered
                ? "justify-center text-center"
                : ""
            }
          `}
        >
          {isMovie && (
            <span className="shrink-0 text-2xl">
              🎬
            </span>
          )}

          {isSeries && (
            <span className="shrink-0 text-2xl">
              📺
            </span>
          )}

          <h3
            className="
              text-base
              font-semibold
              leading-snug
              tracking-tight
              text-white
            "
            style={{
              fontFamily:
                "var(--font-manrope)",
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
              ml-3
              shrink-0

              text-lg
              text-zinc-500

              transition-all
              duration-300

              group-hover:translate-x-1
              group-hover:text-red-400
            "
          >
            →
          </span>
        )}
      </div>
    </button>
  );
}