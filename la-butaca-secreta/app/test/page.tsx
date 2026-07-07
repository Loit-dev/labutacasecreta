"use client";

import { ConversationEngine } from "@/lib/conversation";

export default function TestPage() {
  const engine = new ConversationEngine();

  const node = engine.getNextNode();

  return (
    <main className="p-10 text-white">
      <h1 className="text-3xl font-bold">Motor de conversación</h1>

      <pre className="mt-8">
        {JSON.stringify(node, null, 2)}
      </pre>
    </main>
  );
}