type Props = {
  label: string;
  onClick: () => void;
};

export default function AnswerButton({
  label,
  onClick,
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

        rounded-md

        border
        border-dashed
        border-amber-200/25

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
        hover:border-amber-300/50
        hover:shadow-[0_0_20px_rgba(250,204,21,0.12)]

        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-white
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
        className="
          relative
          flex
          h-full
          items-center
          justify-between
        "
      >
        <div
          className="
            flex
            flex-1
            items-center
            gap-3
          "
        >
          {isMovie && (
            <span
              className="shrink-0 text-2xl"
              aria-hidden="true"
            >
              🎬
            </span>
          )}

          {isSeries && (
            <span
              className="shrink-0 text-2xl"
              aria-hidden="true"
            >
              📺
            </span>
          )}

          <span className="marquee-font text-lg leading-snug text-white">
            {label
              .replace("🎬 ", "")
              .replace("📺 ", "")}
          </span>
        </div>

        <span
          aria-hidden="true"
          className="
            ml-3
            shrink-0

            text-lg
            text-zinc-400

            transition-all
            duration-300

            group-hover:translate-x-1
            group-hover:text-red-400
          "
        >
          →
        </span>
      </div>
    </button>
  );
}