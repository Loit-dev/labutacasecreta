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
    next: ["mood", "restrictions"],
    options: [
      {
        id: "alone",
        label: "🙋 Solo",
        value: "alone",
      },
      {
        id: "partner",
        label: "❤️ En pareja",
        value: "partner",
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
    next: ["restrictions"],
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
    next: ["freshness"],
    options: [
      {
        id: "terror",
        label: "😱 Terror",
        value: "terror",
      },
      {
        id: "violence",
        label: "🩸 Violencia",
        value: "violence",
      },
      {
        id: "romance",
        label: "💕 Romance",
        value: "romance",
      },
      {
        id: "musical",
        label: "🎵 Musical",
        value: "musical",
      },
      {
        id: "documentary",
        label: "🎥 Documental",
        value: "documentary",
      },
      {
        id: "none",
        label: "👍 No tengo ninguna preferencia",
        value: "none",
      },
    ],
  },

  {
    id: "freshness",
    title: "¿Qué te apetece más?",
    required: false,
    informationValue: 25,
    next: ["discoveryMode"],
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

  {
    id: "discoveryMode",
    title: "¿Qué buscas hoy?",
    required: false,
    informationValue: 60,
    next: [],
    options: [
      {
        id: "impact",
        label: "🧠 Algo que me marque",
        value: "impact",
      },
      {
        id: "relax",
        label: "😌 Desconectar y disfrutar",
        value: "relax",
      },
      {
        id: "hidden-gem",
        label: "💎 Descubrir una joya oculta",
        value: "hidden-gem",
      },
      {
        id: "surprise",
        label: "🎲 Sorpréndeme",
        value: "surprise",
      },
    ],
  },
];