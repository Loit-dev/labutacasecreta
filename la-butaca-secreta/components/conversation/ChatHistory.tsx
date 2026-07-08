import { ConversationMessage } from "@/lib/conversation/types";

type Props = {
  messages: ConversationMessage[];
};

export default function ChatHistory({
  messages,
}: Props) {
  return (
    <section className="space-y-6">
      {messages.map((message) => {
        const isBot = message.sender === "bot";

        return (
          <div
            key={message.id}
            className={`flex ${
              isBot ? "justify-start" : "justify-end"
            }`}
          >
            <div className="flex max-w-[85%] items-end gap-3">
              {isBot && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg shadow-lg">
                  🎬
                </div>
              )}

              <div
                className={`rounded-3xl px-5 py-4 leading-7 shadow-lg transition-all ${
                  isBot
                    ? "rounded-bl-md border border-white/10 bg-zinc-800 text-white"
                    : "rounded-br-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                }`}
              >
                {message.text}
              </div>

              {!isBot && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-lg shadow-lg">
                  👤
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}