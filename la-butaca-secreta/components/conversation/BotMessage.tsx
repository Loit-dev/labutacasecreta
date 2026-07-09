import Image from "next/image";

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
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-zinc-700
                    bg-zinc-900
                    shadow-lg
                  "
                >
                  <Image
                    src="/minilogo.png"
                    alt="La Butaca Secreta"
                    width={28}
                    height={28}
                    className="object-contain"
                    priority
                  />
                </div>
              )}

              <div
                className={`rounded-3xl px-5 py-4 leading-7 shadow-lg transition-all ${
                  isBot
                    ? "rounded-bl-md border border-zinc-700 bg-zinc-800 text-white"
                    : "rounded-br-md bg-gradient-to-r from-red-600 to-red-500 text-white"
                }`}
              >
                {message.text}
              </div>

              {!isBot && (
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-zinc-700
                    bg-zinc-900
                    text-lg
                    shadow-lg
                  "
                >
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