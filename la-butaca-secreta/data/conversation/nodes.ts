import { ConversationNode } from "@/lib/conversation/types";

export const conversationNodes: ConversationNode[] = [
  {
    id: "contentType",

    title: "¿Qué te apetece hoy?",

    required: true,

    informationValue: 100,

    next: ["company", "mood"],

    options: [
      {
        id: "movie",
        label: "🎬 Película",
        value: "movie",
      },
      {
        id: "tv",
        label: "📺 Serie",
        value: "tv",
      },
    ],
  },

  {
    id: "company",

    title: "¿Con quién vas a verla?",

    required: true,

    informationValue: 80,

    next: ["mood", "duration"],

    options: [
      {
        id: "alone",
        label: "🙋 Solo",
        value: "alone",
      },
      {
        id: "couple",
        label: "❤️ En pareja",
        value: "couple",
      },
      {
        id: "friends",
        label: "🍻 Con amigos",
        value: "friends",
      },
      {
        id: "family",
        label: "👨‍👩‍👧 En familia",
        value: "family",
      },
    ],
  },

  {
    id: "mood",

    title: "¿Qué te apetece sentir hoy?",

    required: true,

    informationValue: 95,

    next: ["restrictions", "pace", "duration"],

    options: [
      {
        id: "laugh",
        label: "😂 Reírme",
        value: "laugh",
      },
      {
        id: "tension",
        label: "😰 Estar en tensión",
        value: "tension",
      },
      {
        id: "think",
        label: "🤯 Que me haga pensar",
        value: "think",
      },
      {
        id: "emotion",
        label: "❤️ Emocionarme",
        value: "emotion",
      },
      {
        id: "adventure",
        label: "🚀 Vivir una aventura",
        value: "adventure",
      },
      {
        id: "surprise",
        label: "😲 Sorpréndeme",
        value: "surprise",
      },
      {
        id: "anything",
        label: "🎲 Me da igual",
        value: "anything",
      },
    ],
  },

  {
    id: "restrictions",

    title: "¿Hay algo que hoy no te apetezca ver?",

    required: true,

    informationValue: 90,

    next: ["duration", "freshness"],

    options: [],
  },

  {
    id: "duration",

    title: "¿Cuánto tiempo quieres dedicarle?",

    required: false,

    informationValue: 30,

    next: ["freshness"],

    options: [
      {
        id: "short",
        label: "⏱️ Menos de 90 minutos",
        value: "short",
      },
      {
        id: "normal",
        label: "🍿 Una duración normal",
        value: "normal",
      },
      {
        id: "long",
        label: "🎬 Hoy tengo tiempo",
        value: "long",
      },
      {
        id: "any",
        label: "🤷 Me da igual",
        value: "any",
      },
    ],
  },

  {
    id: "freshness",

    title: "¿Qué te apetece más?",

    required: false,

    informationValue: 20,

    next: [],

    options: [
      {
        id: "new",
        label: "🆕 Algo nuevo",
        value: "new",
      },
      {
        id: "classic",
        label: "⭐ Un clásico",
        value: "classic",
      },
      {
        id: "any",
        label: "🎲 Me da igual",
        value: "any",
      },
    ],
  },
];