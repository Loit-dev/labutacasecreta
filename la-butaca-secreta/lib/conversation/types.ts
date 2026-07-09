export type ContentType = "movie" | "tv";

export type DiscoveryMode =
  | "impact"
  | "relax"
  | "hidden-gem"
  | "surprise";

export interface UserProfile {
  contentType?: ContentType;

  company?: string;

  mood?: string;

  discoveryMode?: DiscoveryMode;

  pace?: string;

  duration?: string;

  freshness?: string;

  language?: string;

  animation?: string;

  restrictions?: string[];
}

export interface ConversationOption {
  id: string;
  label: string;
  value: string;
}

export interface ConversationCondition {
  field: keyof UserProfile;
  equals: string;
}

export interface ConversationNode {
  id: keyof UserProfile;
  title: string;
  options: ConversationOption[];
  required: boolean;
  informationValue: number;
  next?: string[];
  conditions?: ConversationCondition[];
}

export interface ConversationMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
}

export interface ConversationContext {
  state: "exploring" | "refining" | "ready";
  confidence: number;
  profile: UserProfile;
  answeredNodes: (keyof UserProfile)[];
  messages: ConversationMessage[];
}