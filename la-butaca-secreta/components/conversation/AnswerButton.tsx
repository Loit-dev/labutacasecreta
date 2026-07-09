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
        min-h-[100px]
        overflow-hidden

        rounded-2xl

        border
        border-zinc-600/80

        bg-gradient-to-br
        from-zinc-900
        via-black
        to-zinc-950

        p-5
        text-left

        shadow-[0_10px_30px_rgba(0,0,0,0.55)]

        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-red-500/60
        hover:shadow-[0_0_25px_rgba(239,68,68,0.20)]
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
          from-red-500/15
          via-transparent
          to-red-500/5

          transition-all
          duration-300

          group-hover:opacity-100
        "
      />

      <div
        className="
          absolute
          inset-0

          rounded-2xl

          opacity-0

          ring-1
          ring-red-500/40

          transition-all
          duration-300

          group-hover:opacity-100
        "
      />

      <div
        className={`relative flex h-full items-center ${
          centered ? "justify-center" : "justify-between"
        }`}
      >
        <div
          className={`flex flex-1 items-center gap-3 ${
            centered ? "justify-center text-center" : ""
          }`}
        >
          {isMovie && (
            <span className="shrink-0 text-3xl">
              🎬
            </span>
          )}

          {isSeries && (
            <span className="shrink-0 text-3xl">
              📺
            </span>
          )}

          <div className="flex items-center">
            <h3
              className="
                text-lg
                font-semibold
                leading-snug
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
        </div>

        {!centered && (
          <span
            className="
              ml-4
              shrink-0

              text-2xl
              text-zinc-500

              transition-all
              duration-300

              group-hover:translate-x-2
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