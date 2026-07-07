import { conversationNodes } from "@/data/conversation/nodes";
import { hasValue } from "./profile";
import {
  ConversationContext,
  ConversationNode,
  UserProfile,
} from "./types";
import { calculateConfidence, isConversationReady } from "./confidence";

export class ConversationEngine {
  private context: ConversationContext;

  constructor(profile?: UserProfile) {
    this.context = {
      state: "exploring",
      confidence: 0,
      profile: profile ?? {},
      answeredNodes: [],
    };

    this.updateState();
  }

  /**
   * Devuelve todo el contexto.
   */
  getContext() {
    return this.context;
  }

  /**
   * Devuelve el perfil actual.
   */
  getProfile() {
    return this.context.profile;
  }

  /**
   * Guarda una respuesta.
   */
  answer(field: keyof UserProfile, value: unknown) {
    this.context.profile[field] = value as never;

    if (!this.context.answeredNodes.includes(field)) {
      this.context.answeredNodes.push(field);
    }

    this.updateState();
  }

  /**
   * Devuelve el siguiente nodo.
   */
  getNextNode(): ConversationNode | null {
    if (isConversationReady(this.context.profile)) {
      return null;
    }

    const availableNodes = conversationNodes
      .filter((node) => !this.context.answeredNodes.includes(node.id))
      .filter((node) => this.checkConditions(node))
      .sort((a, b) => b.informationValue - a.informationValue);

    return availableNodes[0] ?? null;
  }

  /**
   * Comprueba condiciones.
   */
  private checkConditions(node: ConversationNode): boolean {
    if (!node.conditions?.length) {
      return true;
    }

    return node.conditions.every((condition) => {
      return this.context.profile[condition.field] === condition.equals;
    });
  }

  /**
   * Actualiza estado interno.
   */
  private updateState() {
    this.context.confidence = calculateConfidence(this.context.profile);

    if (this.context.confidence >= 85) {
      this.context.state = "ready";
      return;
    }

    if (this.context.confidence >= 45) {
      this.context.state = "refining";
      return;
    }

    this.context.state = "exploring";
  }
}