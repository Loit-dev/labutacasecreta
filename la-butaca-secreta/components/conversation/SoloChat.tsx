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
    currentQuestion,
    answer,
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
