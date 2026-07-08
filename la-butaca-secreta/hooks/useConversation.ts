"use client";

import { useEffect, useMemo, useState } from "react";

import { ConversationEngine } from "@/lib/conversation/engine";
import {
  ConversationMessage,
  ConversationNode,
  UserProfile,
} from "@/lib/conversation/types";

export function useConversation() {
  const engine = useMemo(
    () => new ConversationEngine(),
    []
  );

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