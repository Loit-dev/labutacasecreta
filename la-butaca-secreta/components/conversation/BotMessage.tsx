type Props = {
  text: string;
};

export default function BotMessage({ text }: Props) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xl">
        🍿
      </div>

      <div className="max-w-[80%] rounded-3xl rounded-tl-md bg-zinc-800 px-5 py-4 text-white shadow-md">
        {text}
      </div>
    </div>
  );
}