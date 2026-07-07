type Props = {
  sender: "bot" | "user";
  text: string;
};

export default function ChatMessage({
  sender,
  text,
}: Props) {
  const isBot = sender === "bot";

  return (
    <div
      className={`flex ${
        isBot ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-3xl px-5 py-4 text-base leading-relaxed shadow-md ${
          isBot
            ? "bg-zinc-800 text-white"
            : "bg-yellow-400 font-semibold text-black"
        }`}
      >
        {text}
      </div>
    </div>
  );
}