"use client";

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

  return (
    <>
      <PosterWall />

      <main className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <section className="relative z-30 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur-2xl">
          {/* HERO */}
          <div className="border-b border-white/10 px-8 py-12">
            <Header />

            <div className="mt-8 text-center">
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  "Netflix",
                  "Prime Video",
                  "Disney+",
                  "Max",
                  "Apple TV+",
                  "Filmin",
                ].map((platform) => (
                  <span
                    key={platform}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CHAT */}
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
    </>
  );
}