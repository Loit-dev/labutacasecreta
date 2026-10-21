import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { ConversationEngine } from "@/lib/conversation/engine";
import { conversationNodes } from "@/data/conversation/nodes";

describe("ConversationEngine", () => {
  test("empieza preguntando qué se quiere ver (película o serie)", () => {
    const engine = new ConversationEngine();

    engine.startConversation();

    assert.equal(engine.getNextNode()?.id, "contentType");
  });

  test("las restricciones se guardan como lista", () => {
    const engine = new ConversationEngine();

    engine.answer("restrictions", "terror", "Nada de terror");

    assert.deepEqual(engine.getProfile().restrictions, [
      "terror",
    ]);
  });

  test("el resto de respuestas se guardan tal cual", () => {
    const engine = new ConversationEngine();

    engine.answer("mood", "laugh", "Reírme");
    engine.answer("company", "partner", "En pareja");

    assert.equal(engine.getProfile().mood, "laugh");
    assert.equal(engine.getProfile().company, "partner");
  });

  test("no repite preguntas ya contestadas", () => {
    const engine = new ConversationEngine();

    engine.answer("contentType", "movie", "Película");

    assert.notEqual(engine.getNextNode()?.id, "contentType");
  });

  test("tras contestar todas las preguntas, la conversación termina", () => {
    const engine = new ConversationEngine();

    let guard = 0;

    for (
      let node = engine.getNextNode();
      node && guard < 50;
      node = engine.getNextNode(), guard++
    ) {
      engine.answer(node.id, node.options[0].value, "respuesta");
    }

    assert.equal(engine.getNextNode(), null);
    assert.ok(guard < 50);
  });

  test("las respuestas del usuario y del bot se guardan en orden", () => {
    const engine = new ConversationEngine();

    engine.answer("mood", "laugh", "Reírme");

    const senders = engine.getMessages().map((m) => m.sender);

    assert.deepEqual(senders, ["user", "bot"]);
    assert.equal(engine.getMessages()[0].text, "Reírme");
  });
});

describe("preguntas de la conversación", () => {
  test("cada pregunta tiene opciones con valor único", () => {
    for (const node of conversationNodes) {
      assert.ok(node.options.length >= 2, node.id);

      const values = node.options.map((o) => o.value);

      assert.equal(new Set(values).size, values.length, node.id);
    }
  });

  test("no hay dos preguntas para el mismo dato", () => {
    const ids = conversationNodes.map((node) => node.id);

    assert.equal(new Set(ids).size, ids.length);
  });
});
