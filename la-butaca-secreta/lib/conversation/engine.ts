import { conversationNodes } from "@/data/conversation/nodes";
import { calculateConfidence } from "./confidence";
import {
  getGreeting,
  getReaction,
} from "./personality";

import {
  ConversationContext,
  ConversationMessage,
  ConversationNode,
  UserProfile,
} from "./types";

export class ConversationEngine {
  private context: ConversationContext;

  constructor(profile?: UserProfile) {
    this.context = {
      state: "exploring",
      confidence: 0,
      profile: profile ?? {},
      answeredNodes: [],
      messages: [],
    };

    this.updateState();
  }

  // ============================
  // PUBLIC API
  // ============================

  getContext() {
    return this.context;
  }

  getProfile() {
    return this.context.profile;
  }

  getMessages() {
    return this.context.messages;
  }

  startConversation() {
    if (this.context.messages.length > 0) return;

    // Mensaje inicial aleatorio
    this.addBotMessage(getGreeting());

    // Primera pregunta
    const firstQuestion = this.getNextNode();

    if (firstQuestion) {
      this.addBotMessage(firstQuestion.title);
    }
  }

  answer(
    field: keyof UserProfile,
    value: string,
    label: string
  ): ConversationNode | null {
    this.context.profile[field] = value as never;

    if (!this.context.answeredNodes.includes(field)) {
      this.context.answeredNodes.push(field);
    }

    this.addUserMessage(label);

    this.addBotMessage(
      getReaction(field as string, value)
    );

    this.updateState();

    return this.getNextNode();
  }

  getNextNode(): ConversationNode | null {
    const node = conversationNodes
      .filter(
        (node) =>
          !this.context.answeredNodes.includes(node.id)
      )
      .filter((node) => this.checkConditions(node))
      .sort(
        (a, b) =>
          b.informationValue - a.informationValue
      )[0];

    return node ?? null;
  }

  // ============================
  // MESSAGE API
  // ============================

  public addBotMessage(text: string) {
    this.addMessage("bot", text);
  }

  public addUserMessage(text: string) {
    this.addMessage("user", text);
  }

  // ============================
  // PRIVATE
  // ============================

  private addMessage(
    sender: "bot" | "user",
    text: string
  ) {
    const message: ConversationMessage = {
      id: crypto.randomUUID(),
      sender,
      text,
    };

    this.context.messages.push(message);
  }

  private checkConditions(
    node: ConversationNode
  ): boolean {
    if (!node.conditions?.length) {
      return true;
    }

    return node.conditions.every((condition) => {
      return (
        this.context.profile[condition.field] ===
        condition.equals
      );
    });
  }

  private updateState() {
    this.context.confidence = calculateConfidence(
      this.context.profile
    );

    if (this.context.confidence >= 85) {
      this.context.state = "ready";
    } else if (this.context.confidence >= 45) {
      this.context.state = "refining";
    } else {
      this.context.state = "exploring";
    }
  }
}