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
        w-full
        rounded-2xl
        bg-yellow-400
        p-5
        text-lg
        font-bold
        text-black
        shadow-lg
        transition
        hover:bg-yellow-300
      "
    >
      {label}
    </button>
  );
}