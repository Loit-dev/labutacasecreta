type ReactionMap = {
  [field: string]: {
    [value: string]: string[];
  };
};

function random(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)];
}

/* ===========================
   TÍTULOS
=========================== */

const titles = [
  "🎬 Ayúdame a decidir",
  "🍿 No sé qué ver",
  "✨ Sorpréndeme",
  "🎥 Vamos allá",
  "🛋️ Buscar mi próxima película",
];

export function getTitle() {
  return random(titles);
}

/* ===========================
   SALUDOS
=========================== */

const greetings = [
  "Hoy voy a ayudarte a encontrar algo que realmente te apetezca ver.",
  "Hoy no vas a perder media hora buscando.",
];

export function getGreeting() {
  return random(greetings);
}

/* ===========================
   PENSANDO
=========================== */

const thinkingMessages = [
  "He descartado miles de opciones...",
  "Buscando algo que encaje contigo...",
  "Creo que ya voy teniendo una buena idea...",
  "Descartando lo que no merece la pena...",
  "Afinando un poco más...",
  "Ya casi lo tengo...",
];

export function getThinkingMessage() {
  return random(thinkingMessages);
}

/* ===========================
   REACCIONES
=========================== */

const reactions: ReactionMap = {
  contentType: {
    movie: [
      "Hoy toca cine. 🍿",
      "Buena elección. Vamos a buscar una película que merezca la pena.",
      "Me gusta el plan. 🎬",
      "Película entonces. Vamos allá.",
    ],

    tv: [
      "Una buena serie siempre es un gran plan. 📺",
      "Vamos a encontrar una serie que enganche desde el primer episodio.",
      "Serie elegida. Ahora viene lo interesante.",
      "Buena elección. Hay auténticas joyas esperándote.",
    ],
  },

  company: {
    alone: [
      "Buscaré algo pensado para disfrutar a tu ritmo.",
      "Esta sesión es solo para ti. 🍿",
      "Entonces puedo ser un poco más atrevido con las recomendaciones.",
    ],

    partner: [
      "Intentaré encontrar algo que os guste a los dos. ❤️",
      "Nada de discusiones esta noche. 😄",
      "Buscaré un equilibrio para que ambos disfrutéis.",
    ],

    friends: [
      "Con amigos siempre apetecen cosas con ritmo. 😎",
      "Vamos a buscar algo que funcione en grupo.",
      "Toca noche de sofá y palomitas. 🍿",
    ],

    family: [
      "Buscaré algo que funcione para toda la familia.",
      "Vamos a intentar que nadie proteste por la elección. 😄",
      "Que todos disfruten es el objetivo.",
    ],
  },

  mood: {
    laugh: [
      "Hoy toca desconectar. 😄",
      "Nada como unas buenas risas.",
      "Creo que una comedia puede venirte muy bien.",
    ],

    think: [
      "Me gusta. Vamos a buscar algo que deje huella.",
      "Hoy toca darle un poco al coco. 🧠",
      "Buscaré algo que siga rondándote la cabeza cuando termine.",
    ],

    tension: [
      "Hoy quieres emoción. Entendido.",
      "Vamos a buscar algo que te mantenga pegado al sofá.",
      "Creo que tengo varias opciones muy interesantes.",
    ],

    cry: [
      "De vez en cuando también apetece emocionarse.",
      "Buscaré historias que lleguen de verdad.",
      "Hoy toca una película con corazón.",
    ],
  },
};

export function getReaction(
  field: string,
  value: string
): string {
  const fieldReactions = reactions[field];

  if (!fieldReactions) {
    return random(["Anotado.", "Vamos allá.", "Entendido."]);
  }

  const values = fieldReactions[value];

  if (!values?.length) {
    return random(["Anotado.", "Vamos allá.", "Entendido."]);
  }

  return random(values);
}