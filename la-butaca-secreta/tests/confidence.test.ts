import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { calculateConfidence } from "@/lib/conversation/confidence";
import { conversationNodes } from "@/data/conversation/nodes";
import { ConversationEngine } from "@/lib/conversation/engine";

describe("calculateConfidence", () => {
  test("contestar todas las preguntas reales llega al 100%", () => {
    const engine = new ConversationEngine();

    let guard = 0;

    for (
      let node = engine.getNextNode();
      node && guard < 50;
      node = engine.getNextNode(), guard++
    ) {
      engine.answer(node.id, node.options[0].value, "respuesta");
    }

    assert.equal(engine.getContext().confidence, 100);
  });

  test("ninguna pregunta real se queda sin aportar (la barra nunca se atasca)", () => {
    // Si una pregunta de verdad (de data/conversation/nodes.ts) no
    // suma nada en calculateConfidence, el usuario la contesta y la
    // barra de progreso no se mueve.
    for (const node of conversationNodes) {
      const value =
        node.id === "restrictions" ? ["terror"] : "x";

      const confidence = calculateConfidence({
        [node.id]: value,
      } as Parameters<typeof calculateConfidence>[0]);

      assert.ok(
        confidence > 0,
        `la pregunta «${node.id}» no mueve la barra de progreso`
      );
    }
  });
});
