import { ConversationNode } from "@/lib/conversation/types";

export const conversationNodes: ConversationNode[] = [
  {
    id: "contentType",
    title: "¿Qué te apetece hoy?",
    required: true,
    informationValue: 100,
    next: ["mood"],
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
    next: ["discoveryMode"],
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
    next: ["preferredGenre"],
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
  id: "preferredGenre",
  title: "¿Qué te apetece ver?",
  required: true,
  informationValue: 90,
  next: ["company"],
  options: [
    {
      id: "scifi",
      label: "🚀 Ciencia ficción",
      value: "scifi",
    },
    {
      id: "action",
      label: "🔫 Acción",
      value: "action",
    },
    {
      id: "thriller",
      label: "🕵️ Thriller",
      value: "thriller",
    },
    {
      id: "comedy",
      label: "😂 Comedia",
      value: "comedy",
    },
    {
      id: "horror",
      label: "😱 Terror",
      value: "horror",
    },
    {
      id: "drama",
      label: "🎭 Drama",
      value: "drama",
    },
    {
      id: "romance",
      label: "❤️ Romance",
      value: "romance",
    },
    {
      id: "adventure",
      label: "⚔️ Aventuras",
      value: "adventure",
    },
  ],
},

  {
    id: "restrictions",
    title: "🚫 Antes de terminar, ¿hay algo que quieras evitar?",
    required: true,
    informationValue: 10,
    next: ["freshness"],
    options: [
      {
        id: "terror",
        label: "🚫 Nada de terror",
        value: "terror",
      },
      {
        id: "violence",
        label: "🚫 Nada violento",
        value: "violence",
      },
      {
        id: "romance",
        label: "🚫 Nada romántico",
        value: "romance",
      },
      {
        id: "musical",
        label: "🚫 Nada musical",
        value: "musical",
      },
      {
        id: "documentary",
        label: "🚫 Nada documental",
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
    informationValue: 60,
    next: ["restrictions"],
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
    informationValue: 70,
    next: ["freshness"],
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