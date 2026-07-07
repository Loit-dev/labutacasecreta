/**
 * ==========================================
 * La Butaca Secreta
 * Conversation Engine - Types
 * ==========================================
 */

export type ConversationState =
  | "exploring"
  | "refining"
  | "ready";

export type ContentType = "movie" | "tv";

export type Company =
  | "alone"
  | "couple"
  | "friends"
  | "family";

export type Mood =
  | "laugh"
  | "tension"
  | "think"
  | "emotion"
  | "adventure"
  | "surprise"
  | "anything";

export type Pace =
  | "fast"
  | "balanced"
  | "slow"
  | "any";

export type Freshness =
  | "new"
  | "classic"
  | "any";

export type Duration =
  | "short"
  | "normal"
  | "long"
  | "any";

export type Language =
  | "spanish"
  | "original"
  | "any";

export type Animation =
  | "animation"
  | "live_action"
  | "any";

/**
 * Toda la información conocida del usuario.
 * El motor irá rellenando este objeto conforme
 * avanza la conversación.
 */
export interface UserProfile {
  contentType?: ContentType;

  company?: Company;

  mood?: Mood;

  restrictions?: string[];

  duration?: Duration;

  pace?: Pace;

  freshness?: Freshness;

  language?: Language;

  animation?: Animation;
}

/**
 * Una opción de respuesta.
 */
export interface ConversationOption {

  id: string;

  label: string;

  value: string;
}

/**
 * Nodo conversacional.
 */
export interface ConversationNode {

  id: string;

  title: string;

  description?: string;

  required: boolean;

  informationValue: number;

  options: ConversationOption[];

  conditions?: {

      field: keyof UserProfile;

      equals: string;

  }[];

  next: string[];
}

/**
 * Respuesta seleccionada por el usuario.
 */
export interface ConversationAnswer {

  nodeId: string;

  value: string;
}

/**
 * Estado completo de la conversación.
 */
export interface ConversationContext {

  state: ConversationState;

  confidence: number;

  profile: UserProfile;

  answeredNodes: string[];
}