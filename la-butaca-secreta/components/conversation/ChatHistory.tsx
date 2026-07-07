"use client";

import { useEffect, useRef } from "react";

import ChatMessage from "./ChatMessage";

import { ConversationMessage } from "@/lib/conversation/types";

type Props = {
  messages: ConversationMessage[];
};

export default function ChatHistory({
  messages,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          sender={message.sender}
          text={message.text}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}