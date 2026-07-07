"use client";

import { useEffect, useMemo, useState } from "react";

import { ConversationEngine } from "@/lib/conversation/engine";
import {
  ConversationMessage,
  ConversationNode,
} from "@/lib/conversation/types";

import { getUserReply } from "@/lib/conversation/userReplies";

export function useConversation() {
  const engine = useMemo(() => new ConversationEngine(), []);

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] =
    useState<ConversationNode | null>(null);

  const [isThinking, setIsThinking] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    engine.startConversation();

    setMessages([...engine.getMessages()]);
    setCurrentQuestion(engine.getNextNode());
  }, [engine]);

  async function answer(
    value: string,
    label: string
  ) {
    if (!currentQuestion) return;

    setIsThinking(true);

    // Convertimos el botón pulsado en una frase natural
    const reply = getUserReply(
      currentQuestion.id,
      value,
      label
    );

    engine.answer(
      currentQuestion.id,
      value,
      reply
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    const next = engine.getNextNode();

    if (next) {
      engine.addBotMessage(next.title);
    }

    setMessages([...engine.getMessages()]);
    setCurrentQuestion(next);
    setFinished(next === null);

    setIsThinking(false);
  }

  return {
    messages,
    currentQuestion,
    answer,
    isThinking,
    finished,
  };
}