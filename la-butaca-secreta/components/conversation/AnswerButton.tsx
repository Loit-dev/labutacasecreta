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
      border-zinc-700
      bg-zinc-900
      px-6
      py-5
      text-left
      text-lg
      font-semibold
      text-white
      shadow-lg
      transition-all
      duration-200
      hover:-translate-y-1
      hover:border-indigo-500
      hover:bg-zinc-800
      hover:shadow-indigo-500/20
      active:scale-[0.98]
      "
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>

        <span className="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-indigo-400">
          →
        </span>
      </div>
    </button>
  );
}