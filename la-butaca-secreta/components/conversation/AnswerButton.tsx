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
        min-h-[170px]
        overflow-hidden

        rounded-[2rem]

        border
        border-zinc-600/80

        bg-gradient-to-br
        from-zinc-900
        via-black
        to-zinc-950

        p-8
        text-left

        shadow-[0_15px_40px_rgba(0,0,0,0.65)]

        transition-all
        duration-300

        hover:-translate-y-2
        hover:border-red-500/60
        hover:shadow-[0_0_40px_rgba(239,68,68,0.25)]
      "
    >
      {/* Brillo permanente */}
      <div
        className="
          absolute
          inset-0

          bg-gradient-to-br
          from-white/[0.04]
          via-transparent
          to-red-500/[0.02]
        "
      />

      {/* Glow hover */}
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

      {/* Ring hover */}
      <div
        className="
          absolute
          inset-0

          rounded-[2rem]

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
          className={`flex flex-1 items-center gap-5 ${
            centered ? "justify-center text-center" : ""
          }`}
        >
          {isMovie && (
            <span className="shrink-0 text-5xl">
              🎬
            </span>
          )}

          {isSeries && (
            <span className="shrink-0 text-5xl">
              📺
            </span>
          )}

          <div className="flex min-h-[88px] items-center">
            <h3
              className="
                text-3xl
                font-semibold
                leading-tight
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
              ml-6
              shrink-0

              text-5xl
              text-zinc-500

              transition-all
              duration-300

              group-hover:translate-x-3
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