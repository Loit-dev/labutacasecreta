type Props = {
  label: string;
  onClick: () => void;
};

export default function AnswerButton({
  label,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="
        group
        w-full
        rounded-2xl
        border
        border-white/10
        bg-white/5
        px-6
        py-5
        text-left
        text-lg
        font-semibold
        text-white
        backdrop-blur-sm
        transition-all
        duration-200
        hover:scale-[1.02]
        hover:border-red-400/60
        hover:bg-red-500/10
        hover:shadow-xl
        active:scale-[0.98]
      "
    >
      <span className="transition group-hover:translate-x-1 inline-block">
        {label}
      </span>
    </button>
  );
}