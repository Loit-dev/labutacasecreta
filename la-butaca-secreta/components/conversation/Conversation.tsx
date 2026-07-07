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
    currentQuestion,
    answer,
    isThinking,
    finished,
  } = useConversation();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10">
      <Header />

      <div className="mt-10 flex-1">
        <ChatHistory messages={messages} />

        {isThinking && (
          <div className="mt-6">
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
            <Recommendations />
          </div>
        )}
      </div>
    </main>
  );
}