/**
 * Catálogo de logros ("sistema de logros", ver claude/sistema-logros.md
 * en el proyecto de Claude). Dato puro, sin React ni Supabase, igual
 * que lib/compatibility.ts y lib/summary.ts — así se puede testear sin
 * depender del navegador.
 *
 * 12 familias generales + 18 de género (5 niveles cada una: Bronce,
 * Plata, Oro, Platino, Diamante) + 3 estacionales sin nivel + el
 * logro especial "Beta tester" (se concede, no se calcula).
 */

export const TIER_NAMES = [
  "Bronce",
  "Plata",
  "Oro",
  "Platino",
  "Diamante",
] as const;

export type Tier = 0 | 1 | 2 | 3 | 4 | 5;

// Nombre de icono: clave que resuelve components/achievements/AchievementIcon.tsx
// contra los iconos reales de components/icons/Icons.tsx. Mantenido
// como string (no un componente) para que este fichero siga siendo
// datos puros, sin imports de React.
export type IconName =
  | "clapper"
  | "trophy"
  | "fire"
  | "star"
  | "ban"
  | "brain"
  | "compass"
  | "person"
  | "cheers"
  | "share"
  | "bulb"
  | "bookmark"
  | "bolt"
  | "search"
  | "laugh"
  | "ghost"
  | "masks"
  | "heart"
  | "family"
  | "palette"
  | "crime"
  | "camera"
  | "wizardHat"
  | "scroll"
  | "rocket"
  | "musicNote"
  | "swords"
  | "cowboyHat"
  | "christmasTree";

export type AchievementFamily = {
  key: string;
  section: "general" | "genero";
  name: string;
  /** Qué se cuenta, en una frase corta (para la tabla/tooltip). */
  metric: string;
  icon: IconName;
  thresholds: readonly [number, number, number, number, number];
  levelNames: readonly [string, string, string, string, string];
};

export const GENERAL_FAMILIES: AchievementFamily[] = [
  {
    key: "volumen_diario",
    section: "general",
    name: "Volumen diario",
    metric: "títulos vistos en un mismo día",
    icon: "clapper",
    thresholds: [3, 5, 8, 12, 20],
    levelNames: [
      "Tarde de sofá",
      "Maratonista",
      "Sin pausas",
      "Modo atracón",
      "Insomne del mando",
    ],
  },
  {
    key: "total_visto",
    section: "general",
    name: "Total visto",
    metric: "títulos vistos en total",
    icon: "trophy",
    thresholds: [25, 100, 250, 500, 1000],
    levelNames: [
      "Recién llegado",
      "Aficionado",
      "Veterano",
      "Enciclopedia andante",
      "Leyenda de la cartelera",
    ],
  },
  {
    key: "racha",
    section: "general",
    name: "Racha",
    metric: "días seguidos valorando",
    icon: "fire",
    thresholds: [7, 14, 30, 60, 120],
    levelNames: [
      "Semana completa",
      "Costumbre",
      "Rutina de hierro",
      "Inquebrantable",
      "Parte de tu vida",
    ],
  },
  {
    key: "valoraciones",
    section: "general",
    name: "Valoraciones",
    metric: "valoraciones totales escritas",
    icon: "star",
    thresholds: [5, 10, 50, 150, 400],
    levelNames: [
      "Primeros pasos",
      "Opinión propia",
      "Voz con criterio",
      "Crítico de guardia",
      "Pluma afilada",
    ],
  },
  {
    key: "valoraciones_bajas",
    section: "general",
    name: "Valoraciones bajas",
    metric: "valoraciones de 1-2★ dadas",
    icon: "ban",
    thresholds: [5, 15, 40, 100, 250],
    levelNames: [
      "Sin pelos en la lengua",
      "Exigente",
      "Mano dura",
      "Implacable",
      "El azote de Hollywood",
    ],
  },
  {
    key: "nota_media",
    section: "general",
    name: "Nota media",
    metric: "veces que tu nota queda ≥1 punto por debajo de la media TMDb",
    icon: "brain",
    thresholds: [20, 50, 100, 250, 500],
    levelNames: [
      "Buen ojo",
      "Paladar fino",
      "Cinéfilo exigente",
      "Catador de clásicos",
      "Oráculo del cine",
    ],
  },
  {
    key: "generos_vistos",
    section: "general",
    name: "Géneros vistos",
    metric: "géneros distintos vistos",
    icon: "compass",
    thresholds: [3, 5, 8, 12, 16],
    levelNames: [
      "Curioso",
      "Explorador",
      "Sin fronteras",
      "Todo terreno",
      "Ningún género se resiste",
    ],
  },
  {
    key: "amigos",
    section: "general",
    name: "Amigos",
    metric: "nº de amigos",
    icon: "person",
    thresholds: [5, 15, 40, 100, 250],
    levelNames: [
      "Primer amigo",
      "Sociable",
      "Alma de la fiesta",
      "Conocido por todos",
      "Red social en persona",
    ],
  },
  {
    key: "compatibilidad",
    section: "general",
    name: "Compatibilidad",
    metric: "amigos con los que alcanzas ≥80% de compatibilidad",
    icon: "cheers",
    thresholds: [3, 8, 15, 30, 60],
    levelNames: [
      "Primer gemelo de cine",
      "Buena compañía",
      "Club de cinéfilos",
      "Imán de gemelos",
      "Todos son tus gemelos de cine",
    ],
  },
  {
    key: "compartir",
    section: "general",
    name: "Compartir",
    metric: "veces compartido perfil/compatibilidad/resumen",
    icon: "share",
    thresholds: [5, 15, 40, 100, 250],
    levelNames: [
      "Primer compartido",
      "Boca a boca",
      "Embajador",
      "Altavoz oficial",
      "Influencer de butaca",
    ],
  },
  {
    key: "recomendaciones",
    section: "general",
    name: "Recomendaciones",
    metric: "títulos recomendados a amigos",
    icon: "bulb",
    thresholds: [5, 15, 40, 100, 250],
    levelNames: [
      "Primer consejo",
      "Buen consejo",
      "Siempre acierta",
      "El oráculo de tus amigos",
      "Nadie decide sin preguntarte",
    ],
  },
  {
    key: "listas_creadas",
    section: "general",
    name: "Listas creadas",
    metric: "listas creadas",
    icon: "bookmark",
    thresholds: [5, 10, 20, 40, 80],
    levelNames: [
      "Primera lista",
      "Coleccionista",
      "Organizador nato",
      "Archivista",
      "Bibliotecario de butaca",
    ],
  },
];

// Umbral común a las 18 familias de género: 5 / 15 / 35 / 75 / 150.
const GENRE_THRESHOLDS = [5, 15, 35, 75, 150] as const;

// name: debe coincidir EXACTO con las cadenas que guarda `watched.genres`
// (lib/tmdb/mapper.ts → GENRES). Importante: TMDb llama "Suspense" al
// género 53 en su API, pero esta app lo muestra y lo guarda como
// "Thriller" — la familia usa ese nombre, no "Suspense".
const GENRE_DEFS: {
  name: string;
  icon: IconName;
  levelNames: readonly [string, string, string, string, string];
}[] = [
  {
    name: "Acción",
    icon: "bolt",
    levelNames: ["Adrenalina", "Explosivo", "A prueba de balas", "Héroe de acción", "Imparable"],
  },
  {
    name: "Aventura",
    icon: "compass",
    levelNames: ["Mochila lista", "Explorador nato", "Buscatesoros", "Sin mapa ni miedo", "Leyenda viva"],
  },
  {
    name: "Animación",
    icon: "palette",
    levelNames: ["Dibujos animados", "Fan del 2D", "Pixelado de corazón", "Eterno niño", "Maestro Pixar"],
  },
  {
    name: "Comedia",
    icon: "laugh",
    levelNames: ["Risa fácil", "Bromista", "Rey de las carcajadas", "Comediante honorario", "Nada le hace sombra"],
  },
  {
    name: "Crimen",
    icon: "crime",
    levelNames: ["Testigo", "Investigador", "Mente criminal", "El cerebro", "Padrino del género"],
  },
  {
    name: "Documental",
    icon: "camera",
    levelNames: ["Curioso", "Buscador de verdad", "Erudito", "Enciclopedia viva", "Académico honorario"],
  },
  {
    name: "Drama",
    icon: "masks",
    levelNames: ["Lagrimita", "Alma sensible", "Corazón de cristal", "Experto en dramas", "Maestro del llanto"],
  },
  {
    name: "Fantasía",
    icon: "wizardHat",
    levelNames: ["Soñador", "Mago aprendiz", "Habitante de otro mundo", "Elegido", "Señor de la fantasía"],
  },
  {
    name: "Terror",
    icon: "ghost",
    levelNames: ["Valiente", "Sin miedo", "Noche en vela", "Inmune al susto", "El monstruo ya te teme"],
  },
  {
    name: "Misterio",
    icon: "search",
    levelNames: ["Pista encontrada", "Detective aficionado", "Ojo de lince", "Nada se te escapa", "El enigma resuelto"],
  },
  {
    name: "Romance",
    icon: "heart",
    levelNames: ["Corazón blando", "Romántico", "Cupido particular", "Alma enamorada", "El amor de tu vida (de pantalla)"],
  },
  {
    name: "Ciencia ficción",
    icon: "rocket",
    levelNames: ["Viajero espacial", "Explorador galáctico", "Contacto extraterrestre", "Maestro del futuro", "Más allá de las estrellas"],
  },
  {
    name: "Thriller",
    icon: "search",
    levelNames: ["Al filo del asiento", "Pulso firme", "Nervios de acero", "Nada te sorprende", "El rey del suspense"],
  },
  {
    name: "Bélica",
    icon: "swords",
    levelNames: ["Recluta", "Veterano de guerra", "Estratega", "General", "Héroe de guerra"],
  },
  {
    name: "Western",
    icon: "cowboyHat",
    levelNames: ["Forastero", "Pistolero", "El bueno, el feo...", "Leyenda del Oeste", "El último vaquero"],
  },
  {
    name: "Música",
    icon: "musicNote",
    levelNames: ["Oído fino", "Melómano", "Ritmo en las venas", "Director de orquesta", "Leyenda musical"],
  },
  {
    name: "Familia",
    icon: "family",
    levelNames: ["Noche en familia", "Peli para todos", "El favorito de la casa", "Tradición familiar", "El abuelo cinéfilo"],
  },
  {
    name: "Historia",
    icon: "scroll",
    levelNames: ["Viajero en el tiempo", "Estudioso", "Cronista", "Historiador", "Testigo de la Historia"],
  },
];

export const GENRE_FAMILIES: AchievementFamily[] = GENRE_DEFS.map((g) => ({
  key: `genero_${g.name.toLowerCase().replace(/[^a-z]/g, "")}`,
  section: "genero" as const,
  name: g.name,
  metric: `títulos de ${g.name} vistos`,
  icon: g.icon,
  thresholds: GENRE_THRESHOLDS,
  levelNames: g.levelNames,
}));

export const ALL_FAMILIES: AchievementFamily[] = [
  ...GENERAL_FAMILIES,
  ...GENRE_FAMILIES,
];

export function familyByKey(key: string): AchievementFamily | undefined {
  return ALL_FAMILIES.find((f) => f.key === key);
}

// ───────────────────────── Estacionales (sin nivel) ─────────────────

export type SeasonalAchievement = {
  key: string;
  name: string;
  icon: IconName;
  condition: string;
  /** Género exigido (debe estar en watched.genres de ese título). */
  genre?: string;
  /** Ventana de fechas, en mes (1-12) y día, inclusive. Puede cruzar año (p. ej. 20 dic → 6 ene). */
  window: { startMonth: number; startDay: number; endMonth: number; endDay: number };
  /** true si además de la fecha hace falta comprobar una lista de títulos conocidos (ver christmasTitles.ts). */
  requiresKnownTitles?: boolean;
};

export const SEASONAL_ACHIEVEMENTS: SeasonalAchievement[] = [
  {
    key: "terrorifico",
    name: "Terrorífico",
    icon: "ghost",
    condition: "Ver un título de terror en los días de Halloween",
    genre: "Terror",
    window: { startMonth: 10, startDay: 24, endMonth: 11, endDay: 1 },
  },
  {
    key: "flechazo",
    name: "Flechazo",
    icon: "heart",
    condition: "Ver un romance en San Valentín",
    genre: "Romance",
    window: { startMonth: 2, startDay: 10, endMonth: 2, endDay: 17 },
  },
  {
    key: "navideno",
    name: "Navideño",
    icon: "christmasTree",
    condition: "Ver un título navideño en diciembre",
    window: { startMonth: 12, startDay: 1, endMonth: 12, endDay: 31 },
    requiresKnownTitles: true,
  },
];

// ───────────────────────── Logro especial: Beta tester ─────────────

export const BETA_TESTER_KEY = "beta_tester";

/**
 * Fecha límite (hora de España) hasta la que crear una cuenta concede
 * el logro Beta tester, concedido una sola vez al confirmar el email.
 * Ajustar aquí cuando se decida cerrar la beta.
 */
export const BETA_TESTER_CUTOFF_ISO = "2027-03-01T00:00:00+01:00";
