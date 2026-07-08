"use client";

import Header from "./Header";
import ChatHistory from "./ChatHistory";
import OptionButtons from "./OptionButtons";
import TypingIndicator from "./TypingIndicator";

import Recommendations from "@/components/recommendations/Recommendations";
import { useConversation } from "@/hooks/useConversation";

export default function Conversation() {
  const {
    messages,
    profile,
    currentQuestion,
    answer,
    isThinking,
    finished,
  } = useConversation();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
      <section className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-white/10 px-8 py-8">
          <Header />
        </div>

        <div className="px-8 py-8">
          <ChatHistory messages={messages} />

          {isThinking && (
            <div className="mt-8">
              <TypingIndicator />
            </div>
          )}

          {!finished && !isThinking && (
            <div className="mt-8">
              <OptionButtons
                question={currentQuestion}
                onSelect={answer}
              />
            </div>
          )}

          {finished && (
            <div className="mt-10">
              <Recommendations profile={profile} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}