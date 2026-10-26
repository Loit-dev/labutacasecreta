"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import { ConversationEngine } from "@/lib/conversation/engine";
import {
  ConversationContext,
  ConversationMessage,
  ConversationNode,
  UserProfile,
} from "@/lib/conversation/types";
import { recordCompletion } from "@/lib/memory";

// Quien ha elegido "Solo" no necesita que le preguntemos con quién va:
// ya lo ha dicho en la pantalla anterior. El resto de preguntas (género,
// ánimo...) se preguntan siempre: lo que apetece ver cambia de un día
// para otro, así que no nos las saltamos por lo que se pidió otras veces.
function createEngine() {
  const engine = new ConversationEngine();

  engine.preset("company", "alone");

  return engine;
}

export function useConversation() {
  const engine = useMemo(createEngine, []);

  const [messages, setMessages] = useState<
    ConversationMessage[]
  >([]);

  const [profile, setProfile] =
    useState<UserProfile>({});

  // 0-100: cuánto sabemos ya para recomendar bien (lo usa la barra
  // de progreso del cuestionario)
  const [confidence, setConfidence] = useState(0);

  const [currentQuestion, setCurrentQuestion] =
    useState<ConversationNode | null>(null);

  const [isThinking, setIsThinking] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  // Una copia del contexto antes de cada respuesta de verdad (no de los
  // "preset"), para poder volver atrás. answeredCount es cuántas de esas
  // hay: cuenta lo que ve la persona, no los "preset" automáticos.
  const history = useRef<ConversationContext[]>([]);

  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    engine.startConversation();

    setMessages([...engine.getMessages()]);
    setProfile({ ...engine.getProfile() });
    setConfidence(engine.getContext().confidence);

    setCurrentQuestion(engine.getNextNode());
  }, [engine]);

  async function answer(
    value: string,
    label: string
  ) {
    if (!currentQuestion) return;

    history.current.push(engine.snapshot());

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
    setConfidence(engine.getContext().confidence);

    setCurrentQuestion(next);

    setFinished(next === null);

    setAnsweredCount((count) => count + 1);

    if (next === null) {
      track("quiz_completed", {
        type: engine.getProfile().contentType,
      });

      recordCompletion(engine.getProfile());
    }

    setIsThinking(false);
  }

  /** Deshace la última respuesta y vuelve a esa pregunta. */
  function goBack() {
    const previous = history.current.pop();

    if (!previous) return;

    track("answer_back", {
      question: currentQuestion?.id,
    });

    engine.restore(previous);

    setMessages([...engine.getMessages()]);
    setProfile({ ...engine.getProfile() });
    setConfidence(engine.getContext().confidence);
    setCurrentQuestion(engine.getNextNode());
    setFinished(false);
    setAnsweredCount((count) => Math.max(0, count - 1));
  }

  return {
    messages,
    profile,
    confidence,
    currentQuestion,
    answer,
    goBack,
    canGoBack: answeredCount > 0,
    answeredCount,
    isThinking,
    finished,
  };
}