import Image from "next/image";

import { AccountIcon } from "@/components/conversation/TabIcons";
import { ConversationMessage } from "@/lib/conversation/types";

type Props = {
  messages: ConversationMessage[];
};

export default function ChatHistory({
  messages,
}: Props) {
  return (
    <section
      role="log"
      aria-label="Conversación"
      aria-live="polite"
      className="space-y-6"
    >
      {messages.map((message) => {
        const isBot = message.sender === "bot";

        return (
          <div
            key={message.id}
            className={`flex ${
              isBot ? "justify-start" : "justify-end"
            }`}
          >
            <div className="flex max-w-[85%] items-end gap-4">
              {isBot && (
                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    border
                    border-zinc-700
                    bg-black
                    shadow-lg
                  "
                >
                  <Image
                    src="/logito.png"
                    alt=""
                    width={40}
                    height={40}
                    className="object-contain scale-110"
                    priority
                  />
                </div>
              )}

              <div
                className={`rounded-3xl px-5 py-4 leading-7 shadow-lg transition-all ${
                  isBot
                    ? "rounded-bl-md border border-zinc-700 bg-zinc-800 text-white"
                    : "rounded-br-md bg-[#A3221B] text-white"
                }`}
              >
                {message.text}
              </div>

              {!isBot && (
                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-zinc-700
                    bg-zinc-900
                    shadow-lg
                  "
                >
                  <AccountIcon />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}