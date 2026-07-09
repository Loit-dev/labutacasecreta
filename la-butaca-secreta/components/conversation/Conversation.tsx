"use client";

import { useEffect, useRef } from "react";

import PosterWall from "@/components/layout/PosterWall";

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

  const bottomRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [
    messages,
    currentQuestion,
    isThinking,
    finished,
  ]);

  return (
    <>
      <PosterWall />

      <main className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <section className="relative z-30 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur-2xl">
         <img src="/Logo.png" alt="La Butaca Secreta" className="absolute left-4 top-4 h-9 md:h-12 lg:h-14 w-auto opacity-90" />
          <div className="border-b border-white/10 px-8 pt-8 pb-8">
            <Header />
          </div>

          <div className="px-8 py-6">
            <ChatHistory messages={messages} />

            {isThinking && (
              <div className="mt-8">
                <TypingIndicator />
              </div>
            )}

            {!finished && !isThinking && (
              <div className="mt-4">
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

            <div ref={bottomRef} />
          </div>
        </section>
      </main>
    </>
  );
}