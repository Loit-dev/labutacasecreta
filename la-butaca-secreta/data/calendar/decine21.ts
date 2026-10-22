/**
 * Estrenos de plataformas de streaming en España tomados a mano del
 * calendario mensual de decine21.com (https://decine21.com/estrenos/dvd-bd/):
 * solo título, tipo y día. La plataforma NO se apunta aquí: la web la busca
 * en TMDb (solo cuentan Netflix, Prime Video, Disney+, Max y Filmin) y lo
 * que no esté en ninguna de ellas se descarta.
 *
 * Para añadir un mes: copiar sus títulos aquí (sin sinopsis ni imágenes).
 * Si TMDb no sabe dónde está un título, se puede forzar con `platform`.
 */

import type { PlatformKey } from "@/lib/platforms";

export type Importado = {
  date: string;
  type: "movie" | "tv";
  // Título sin «(Nª temporada)»
  query: string;
  // Año que da la fuente (en temporadas nuevas es el de la temporada)
  year: number;
  season?: number;
  // Solo si TMDb no conoce la plataforma
  platform?: PlatformKey;
};

export const IMPORTADOS: Importado[] = [
  { date: "2026-10-01", type: "movie", query: "Piedad", year: 2014 },
  { date: "2026-10-01", type: "tv", query: "Al este del Edén", year: 2026 },
  { date: "2026-10-01", type: "movie", query: "Flush", year: 2025 },
  { date: "2026-10-01", type: "tv", query: "Coven Academy: El hechizo de las brujas", year: 2026 },
  { date: "2026-10-02", type: "movie", query: "Renoir", year: 2025 },
  { date: "2026-10-02", type: "movie", query: "Lady", year: 2025 },
  { date: "2026-10-02", type: "movie", query: "Joika", year: 2023 },
  { date: "2026-10-02", type: "tv", query: "Reina roja", year: 2026, season: 2 },
  { date: "2026-10-02", type: "movie", query: "Cleaner: Rescate vertical", year: 2025 },
  { date: "2026-10-02", type: "movie", query: "Normal", year: 2026 },
  { date: "2026-10-02", type: "tv", query: "Kill Jackie", year: 2026 },
  { date: "2026-10-02", type: "tv", query: "Prefiero la muerte", year: 2026 },
  { date: "2026-10-02", type: "movie", query: "La última gran escalada: El K2 en invierno", year: 2026 },
  { date: "2026-10-03", type: "movie", query: "Un lugar llamado silencio", year: 2024 },
  { date: "2026-10-04", type: "movie", query: "Recreación de un asesinato", year: 2025 },
  { date: "2026-10-05", type: "movie", query: "Dos días", year: 2026 },
  { date: "2026-10-05", type: "tv", query: "¡A por Jiro!", year: 2026 },
  { date: "2026-10-06", type: "tv", query: "El peso de la justicia", year: 2026 },
  { date: "2026-10-06", type: "movie", query: "Iván & Hadoum", year: 2026 },
  { date: "2026-10-07", type: "tv", query: "El Círculo", year: 2026 },
  { date: "2026-10-07", type: "tv", query: "Pequeños profetas", year: 2026 },
  { date: "2026-10-07", type: "tv", query: "Carrie", year: 2026 },
  { date: "2026-10-07", type: "tv", query: "Big Mood", year: 2024 },
  { date: "2026-10-07", type: "tv", query: "Big Mood", year: 2026, season: 2 },
  { date: "2026-10-07", type: "movie", query: "Bon voyage, Marie", year: 2025 },
  { date: "2026-10-07", type: "movie", query: "¿Quién mató a Alex Odeh?", year: 2026 },
  { date: "2026-10-08", type: "tv", query: "Bajo la superficie", year: 2026 },
  { date: "2026-10-08", type: "movie", query: "Línea de extinción", year: 2024 },
  { date: "2026-10-08", type: "tv", query: "El castillo", year: 2026 },
  { date: "2026-10-09", type: "movie", query: "Animales", year: 2026 },
  { date: "2026-10-09", type: "movie", query: "Pioneras: Solo querían jugar", year: 2025 },
  { date: "2026-10-09", type: "movie", query: "Oasis: Don't Look Back In Anger", year: 2026 },
  { date: "2026-10-09", type: "tv", query: "Marshals: Una historia de Yellowstone", year: 2026, season: 2 },
  { date: "2026-10-09", type: "tv", query: "Aquel", year: 2026 },
  { date: "2026-10-09", type: "movie", query: "Matchbox: La película", year: 2026 },
  { date: "2026-10-11", type: "movie", query: "I, Object", year: 2026 },
  { date: "2026-10-13", type: "movie", query: "Una hija en Tokio", year: 2024 },
  { date: "2026-10-14", type: "movie", query: "El amor de tu vida", year: 2026 },
  { date: "2026-10-14", type: "movie", query: "Zona cero", year: 2026 },
  { date: "2026-10-14", type: "tv", query: "VisionQuest", year: 2026 },
  { date: "2026-10-15", type: "tv", query: "La diplomática", year: 2026, season: 4 },
  { date: "2026-10-15", type: "movie", query: "La tormenta", year: 2026 },
  { date: "2026-10-15", type: "movie", query: "Prime Crime: A True Story", year: 2025 },
  { date: "2026-10-16", type: "movie", query: "Tenzing", year: 2026 },
  { date: "2026-10-16", type: "movie", query: "Lo dejamos acá", year: 2026 },
  { date: "2026-10-16", type: "movie", query: "Masterplan", year: 2026 },
  { date: "2026-10-16", type: "movie", query: "Haciendo amigos", year: 2026 },
  { date: "2026-10-16", type: "tv", query: "Crystal Lake", year: 2026 },
  { date: "2026-10-16", type: "movie", query: "Incontrolable", year: 2025 },
  { date: "2026-10-16", type: "tv", query: "The Five Star Weekend", year: 2026 },
  { date: "2026-10-18", type: "movie", query: "Infierno en el paraíso", year: 2025 },
  { date: "2026-10-19", type: "movie", query: "Los últimos días de María Antonieta", year: 2024 },
  { date: "2026-10-19", type: "tv", query: "In vitro", year: 2026 },
  { date: "2026-10-20", type: "tv", query: "Revancha", year: 2024 },
  { date: "2026-10-20", type: "tv", query: "Farsante", year: 2026 },
  { date: "2026-10-20", type: "movie", query: "Morir no siempre sale bien", year: 2026 },
  { date: "2026-10-21", type: "movie", query: "Vaiana", year: 2026 },
  { date: "2026-10-21", type: "tv", query: "La lista final", year: 2026, season: 2 },
  { date: "2026-10-21", type: "tv", query: "Buscando a Wanda", year: 2026, season: 2 },
  { date: "2026-10-21", type: "movie", query: "Whistle: El silbido del mal", year: 2025 },
  { date: "2026-10-21", type: "movie", query: "Kangaroo: Una aventura en Australia", year: 2025 },
  { date: "2026-10-22", type: "movie", query: "Gail Daughtry y el vale por un rollo VIP", year: 2026 },
  { date: "2026-10-22", type: "tv", query: "Tulsa King", year: 2026, season: 4 },
  { date: "2026-10-23", type: "movie", query: "El sueño americano", year: 2026 },
  { date: "2026-10-23", type: "tv", query: "Swipe Right on the Devil", year: 2026 },
  { date: "2026-10-23", type: "tv", query: "Yaga", year: 2026 },
  { date: "2026-10-25", type: "movie", query: "Viaje al país de los blancos", year: 2026 },
  { date: "2026-10-26", type: "movie", query: "Tony", year: 2026 },
  { date: "2026-10-26", type: "movie", query: "La cita", year: 2025 },
  { date: "2026-10-27", type: "movie", query: "En el camino", year: 2025 },
  { date: "2026-10-28", type: "movie", query: "Portal to Hell", year: 2025 },
  { date: "2026-10-30", type: "tv", query: "Nocturno", year: 2026 },
  { date: "2026-10-30", type: "movie", query: "Viva", year: 2026 },
  { date: "2026-10-30", type: "movie", query: "Apocalipsis Z: Nuevo mundo", year: 2026 },
  { date: "2026-10-30", type: "tv", query: "Caldas. El último barco", year: 2026 },
  { date: "2026-10-31", type: "movie", query: "Hokum", year: 2026 },
  { date: "2026-10-31", type: "tv", query: "Dexter: Resurrección", year: 2026, season: 2 },
  // Noviembre contrastado a mano contra los calendarios "próx. estrenos"
  // de FilmAffinity por plataforma (Netflix, Disney+, HBO Max, Prime
  // Video, Filmin): lo que no aparecía en ninguna de las 5 se ha quitado.
  { date: "2026-11-02", type: "tv", query: "La edad dorada", year: 2026, season: 4 },
  { date: "2026-11-03", type: "tv", query: "Bass X Machina", year: 2026 },
  { date: "2026-11-03", type: "tv", query: "Bookish", year: 2026, season: 2 },
  { date: "2026-11-04", type: "tv", query: "El más grande", year: 2026 },
  { date: "2026-11-04", type: "tv", query: "Todas las de la ley", year: 2026, season: 2 },
  { date: "2026-11-04", type: "movie", query: "La razón de estar contigo: Una Navidad perfecta", year: 2026 },
  { date: "2026-11-04", type: "tv", query: "Desaparecida: Natalee Holloway", year: 2026 },
  { date: "2026-11-04", type: "tv", query: "La emperatriz divorciada", year: 2026 },
  { date: "2026-11-06", type: "tv", query: "Campus Drivers", year: 2026 },
  { date: "2026-11-06", type: "tv", query: "Melania Rea", year: 2026 },
  { date: "2026-11-06", type: "movie", query: "Eleonora Duse, la divina", year: 2026 },
  { date: "2026-11-06", type: "movie", query: "Barrio triste", year: 2026 },
  { date: "2026-11-06", type: "movie", query: "En la alcoba del sultán", year: 2026 },
  { date: "2026-11-06", type: "movie", query: "Broken English", year: 2026 },
  { date: "2026-11-06", type: "movie", query: "La vida era eso", year: 2026 },
  { date: "2026-11-08", type: "tv", query: "Ciudad de Dios: La lucha no para", year: 2026, season: 2 },
  { date: "2026-11-10", type: "tv", query: "Carmen Curlers", year: 2026, season: 3 },
  { date: "2026-11-11", type: "tv", query: "El Señor de los Anillos: Los Anillos de Poder", year: 2026, season: 3 },
  { date: "2026-11-13", type: "tv", query: "Infamia", year: 2026 },
  { date: "2026-11-13", type: "movie", query: "La copia perfecta", year: 2026 },
  { date: "2026-11-13", type: "movie", query: "Todo el mundo a Kenmure Street", year: 2026 },
  { date: "2026-11-17", type: "tv", query: "Soñando en negro", year: 2026 },
  { date: "2026-11-17", type: "tv", query: "Baron Noir", year: 2026 },
  { date: "2026-11-18", type: "movie", query: "Madden", year: 2026 },
  { date: "2026-11-19", type: "movie", query: "Casi todo bien", year: 2026 },
  { date: "2026-11-20", type: "movie", query: "Perfectos mentirosos", year: 2026 },
  { date: "2026-11-20", type: "tv", query: "Percy Jackson y los dioses del Olimpo", year: 2026, season: 3 },
  { date: "2026-11-20", type: "movie", query: "Mala bèstia", year: 2026 },
  { date: "2026-11-20", type: "movie", query: "Cosas que no olvidaré", year: 2026 },
  { date: "2026-11-20", type: "movie", query: "Dos desconocidos intentando no matarse", year: 2026 },
  { date: "2026-11-25", type: "tv", query: "Blade Runner 2099", year: 2026 },
  { date: "2026-11-26", type: "movie", query: "Nuestro héroe, Balthazar", year: 2026 },
  { date: "2026-11-27", type: "movie", query: "15 pruebas de amor", year: 2026 },
  { date: "2026-11-27", type: "movie", query: "El amor que permanece", year: 2026 },
];
