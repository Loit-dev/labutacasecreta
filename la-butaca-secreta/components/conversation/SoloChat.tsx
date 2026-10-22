"use client";

import { useEffect, useMemo, useRef } from "react";

import Recommendations from "@/components/recommendations/Recommendations";
import { useConversation } from "@/hooks/useConversation";

import ChatHistory from "./ChatHistory";
import OptionButtons from "./OptionButtons";
import TypingIndicator from "./TypingIndicator";

export default function SoloChat({
  platforms = "",
}: {
  platforms?: string;
}) {
  const {
    messages,
    profile,
    confidence,
    currentQuestion,
    answer,
    goBack,
    canGoBack,
    isThinking,
    finished,
  } = useConversation();

  const endRef = useRef<HTMLDivElement>(null);

  const fullProfile = useMemo(
    () => (platforms ? { ...profile, platforms } : profile),
    [profile, platforms]
  );

 useEffect(() => {
  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  if (finished) {
    // Solo una vez, para ver el "Buscando…". Cuando llegan los
    // resultados, Recommendations se encarga de bajar hasta ellos.
    const timer = setTimeout(
      scrollToBottom,
      500
    );

    return () => {
      clearTimeout(timer);
    };
  }

  scrollToBottom();

  const timer1 = setTimeout(
    scrollToBottom,
    250
  );

  const timer2 = setTimeout(
    scrollToBottom,
    500
  );

  return () => {
    clearTimeout(timer1);
    clearTimeout(timer2);
  };
}, [
  messages,
  currentQuestion,
  isThinking,
  finished,
]);

  return (
          <div className="px-5 py-4 md:px-8 md:py-6">
            <ChatHistory messages={messages} />

            {isThinking && (
              <div className="mt-8">
                <TypingIndicator />
              </div>
            )}

            {!finished && currentQuestion && (
              <div
                className="mt-4 flex items-center gap-2"
                aria-hidden="true"
              >
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, confidence)}%`,
                    }}
                  />
                </div>

                <span className="shrink-0 text-xs text-zinc-500">
                  {Math.min(100, confidence)}%
                </span>
              </div>
            )}

            {!finished && !isThinking && (
              <div className="mt-4">
                <OptionButtons
                  question={currentQuestion}
                  onSelect={answer}
                />

                {canGoBack && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="mt-3 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span aria-hidden="true">←</span> Volver a la
                    pregunta anterior
                  </button>
                )}
              </div>
            )}

           {finished && (
  <div className="mt-10">
    <Recommendations profile={fullProfile} />
  </div>
)}

            <div
              ref={endRef}
              className="h-2"
            />
          </div>
  );
}
