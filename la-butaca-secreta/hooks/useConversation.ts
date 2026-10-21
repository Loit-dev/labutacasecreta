"use client";

import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { ConversationEngine } from "@/lib/conversation/engine";
import {
  ConversationMessage,
  ConversationNode,
  UserProfile,
} from "@/lib/conversation/types";

// Con quién va ya lo ha dicho al elegir el modo; no se vuelve a preguntar
export type SoloCompany = "alone" | "family";

export function useConversation(company: SoloCompany = "alone") {
  const engine = useMemo(() => {
    const created = new ConversationEngine();

    created.preset("company", company);

    return created;
  }, [company]);

  const [messages, setMessages] = useState<
    ConversationMessage[]
  >([]);

  const [profile, setProfile] =
    useState<UserProfile>({});

  const [currentQuestion, setCurrentQuestion] =
    useState<ConversationNode | null>(null);

  const [isThinking, setIsThinking] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  useEffect(() => {
    engine.startConversation();

    setMessages([...engine.getMessages()]);
    setProfile({ ...engine.getProfile() });

    setCurrentQuestion(engine.getNextNode());
  }, [engine]);

  async function answer(
    value: string,
    label: string
  ) {
    if (!currentQuestion) return;

    setIsThinking(true);

    track("answer", {
      question: currentQuestion.id,
      value,
    });

    engine.answer(
      currentQuestion.id,
      value,
      label
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    const next = engine.getNextNode();

    if (next) {
      engine.addBotMessage(next.title);
    }

    setMessages([...engine.getMessages()]);
    setProfile({ ...engine.getProfile() });

    setCurrentQuestion(next);

    setFinished(next === null);

    if (next === null) {
      track("quiz_completed", {
        type: engine.getProfile().contentType,
      });
    }

    setIsThinking(false);
  }

  return {
    messages,
    profile,
    currentQuestion,
    answer,
    isThinking,
    finished,
  };
}