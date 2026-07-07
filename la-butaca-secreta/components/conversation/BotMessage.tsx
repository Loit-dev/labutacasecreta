type Props = {
  children: React.ReactNode;
};

export default function BotMessage({ children }: Props) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-3xl rounded-bl-md bg-zinc-900 border border-zinc-800 px-5 py-4 shadow-md">
        <div className="mb-2 text-sm font-semibold text-yellow-400">
          🎬 La Butaca Secreta
        </div>

        <div className="text-base leading-7 text-white">
          {children}
        </div>
      </div>
    </div>
  );
}