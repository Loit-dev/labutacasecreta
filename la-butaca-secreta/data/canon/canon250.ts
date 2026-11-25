/**
 * "El Canon": 250 películas imprescindibles de la historia del cine,
 * para que cada usuario vea cuántas lleva vistas y cuáles le faltan.
 *
 * Selección propia (no es la lista oficial de ningún sitio), hecha a
 * mano buscando representar todas las décadas desde los años 20 y el
 * cine de varios países, no solo Hollywood. Es una curación con
 * criterio, no un ranking objetivo: no pretende ser "la" lista
 * definitiva, sino un recorrido razonable por películas que casi
 * cualquier aficionado al cine debería conocer.
 *
 * `query` es el título por el que se busca en TMDb (normalmente el
 * título en español más conocido; si no hay uno asentado, el
 * original). `year` ayuda a desambiguar remakes/homónimas en la
 * búsqueda. `decade` se usa para el filtro por década en la pantalla
 * y siempre coincide con `year` (década a la que pertenece el año).
 * `country` es el país de producción principal, simplificado a uno
 * solo incluso en coproducciones (para el filtro, no para una ficha
 * técnica exacta) — se usa el país con el que la película se asocia
 * más habitualmente. No se guarda el id de TMDb aquí: se resuelve en
 * el servidor (`/api/canon`) y se cachea 24h, igual que en
 * `decine21.ts`.
 *
 * Pulido 25 nov 2026: se encontraron y corrigieron varios fallos de
 * la primera versión (con 250 entradas escritas de una sentada, era
 * cuestión de tiempo) — ver el commit de este cambio para el detalle:
 * una entrada con el título de una película y los datos de búsqueda
 * de otra completamente distinta ("Memorias de África" apuntando a
 * "La espía que me amó"), dos duplicados reales de la misma película
 * bajo dos entradas distintas (GoodFellas/"Uno de los nuestros" dos
 * veces; "Deseando amar"/"In the Mood for Love" dos veces — es la
 * misma película con dos nombres), varias décadas mal asignadas (el
 * campo `decade` no coincidía con `year`) y tres títulos que no se
 * correspondían con su propia búsqueda (apuntaban a otra película).
 */

export type CanonEntry = {
  title: string;
  query: string;
  year: number;
  decade: number;
  director: string;
  country: string;
};

export const CANON: CanonEntry[] = [
  // --- 1920s ---
  { title: "El acorazado Potemkin", query: "El acorazado Potemkin", year: 1925, decade: 1920, director: "Serguéi Eisenstein", country: "URSS" },
  { title: "Metrópolis", query: "Metrópolis", year: 1927, decade: 1920, director: "Fritz Lang", country: "Alemania" },
  { title: "El gabinete del doctor Caligari", query: "El gabinete del doctor Caligari", year: 1920, decade: 1920, director: "Robert Wiene", country: "Alemania" },
  { title: "Nosferatu", query: "Nosferatu", year: 1922, decade: 1920, director: "F. W. Murnau", country: "Alemania" },
  { title: "Amanecer", query: "Amanecer", year: 1927, decade: 1920, director: "F. W. Murnau", country: "Estados Unidos" },
  { title: "El hombre de la cámara", query: "El hombre de la cámara", year: 1929, decade: 1920, director: "Dziga Vertov", country: "URSS" },
  { title: "La quimera del oro", query: "La quimera del oro", year: 1925, decade: 1920, director: "Charles Chaplin", country: "Estados Unidos" },
  { title: "El maquinista de la General", query: "El maquinista de la general", year: 1926, decade: 1920, director: "Buster Keaton", country: "Estados Unidos" },
  { title: "La pasión de Juana de Arco", query: "La pasión de Juana de Arco", year: 1928, decade: 1920, director: "Carl Theodor Dreyer", country: "Francia" },

  // --- 1930s ---
  { title: "M, el vampiro de Düsseldorf", query: "M, el vampiro de Düsseldorf", year: 1931, decade: 1930, director: "Fritz Lang", country: "Alemania" },
  { title: "Luces de la ciudad", query: "Luces de la ciudad", year: 1931, decade: 1930, director: "Charles Chaplin", country: "Estados Unidos" },
  { title: "King Kong", query: "King Kong", year: 1933, decade: 1930, director: "Merian C. Cooper", country: "Estados Unidos" },
  { title: "Sucedió una noche", query: "Sucedió una noche", year: 1934, decade: 1930, director: "Frank Capra", country: "Estados Unidos" },
  { title: "Tiempos modernos", query: "Tiempos modernos", year: 1936, decade: 1930, director: "Charles Chaplin", country: "Estados Unidos" },
  { title: "La regla del juego", query: "La regla del juego", year: 1939, decade: 1930, director: "Jean Renoir", country: "Francia" },
  { title: "Lo que el viento se llevó", query: "Lo que el viento se llevó", year: 1939, decade: 1930, director: "Victor Fleming", country: "Estados Unidos" },
  { title: "El mago de Oz", query: "El mago de Oz", year: 1939, decade: 1930, director: "Victor Fleming", country: "Estados Unidos" },
  { title: "Blancanieves y los siete enanitos", query: "Blancanieves y los siete enanitos", year: 1937, decade: 1930, director: "David Hand", country: "Estados Unidos" },
  { title: "Ninotchka", query: "Ninotchka", year: 1939, decade: 1930, director: "Ernst Lubitsch", country: "Estados Unidos" },
  { title: "Vampyr", query: "Vampyr", year: 1932, decade: 1930, director: "Carl Theodor Dreyer", country: "Francia" },

  // --- 1940s ---
  { title: "Ciudadano Kane", query: "Ciudadano Kane", year: 1941, decade: 1940, director: "Orson Welles", country: "Estados Unidos" },
  { title: "Casablanca", query: "Casablanca", year: 1942, decade: 1940, director: "Michael Curtiz", country: "Estados Unidos" },
  { title: "Qué bello es vivir", query: "Qué bello es vivir", year: 1946, decade: 1940, director: "Frank Capra", country: "Estados Unidos" },
  { title: "El halcón maltés", query: "El halcón maltés", year: 1941, decade: 1940, director: "John Huston", country: "Estados Unidos" },
  { title: "Ladrón de bicicletas", query: "Ladrón de bicicletas", year: 1948, decade: 1940, director: "Vittorio De Sica", country: "Italia" },
  { title: "Roma, ciudad abierta", query: "Roma, ciudad abierta", year: 1945, decade: 1940, director: "Roberto Rossellini", country: "Italia" },
  { title: "Los mejores años de nuestra vida", query: "Los mejores años de nuestra vida", year: 1946, decade: 1940, director: "William Wyler", country: "Estados Unidos" },
  { title: "Luz de gas", query: "Luz de gas", year: 1944, decade: 1940, director: "George Cukor", country: "Estados Unidos" },
  { title: "Rebeca", query: "Rebeca", year: 1940, decade: 1940, director: "Alfred Hitchcock", country: "Estados Unidos" },
  { title: "Perdición", query: "Perdición", year: 1944, decade: 1940, director: "Billy Wilder", country: "Estados Unidos" },
  { title: "El retrato de Jennie", query: "El retrato de Jennie", year: 1948, decade: 1940, director: "William Dieterle", country: "Estados Unidos" },
  { title: "Grandes esperanzas", query: "Grandes esperanzas", year: 1946, decade: 1940, director: "David Lean", country: "Reino Unido" },

  // --- 1950s ---
  { title: "Centauros del desierto", query: "Centauros del desierto", year: 1956, decade: 1950, director: "John Ford", country: "Estados Unidos" },
  { title: "Cantando bajo la lluvia", query: "Cantando bajo la lluvia", year: 1952, decade: 1950, director: "Stanley Donen", country: "Estados Unidos" },
  { title: "Vértigo (De entre los muertos)", query: "Vértigo", year: 1958, decade: 1950, director: "Alfred Hitchcock", country: "Estados Unidos" },
  { title: "La ventana indiscreta", query: "La ventana indiscreta", year: 1954, decade: 1950, director: "Alfred Hitchcock", country: "Estados Unidos" },
  { title: "Con la muerte en los talones", query: "Con la muerte en los talones", year: 1959, decade: 1950, director: "Alfred Hitchcock", country: "Estados Unidos" },
  { title: "Río Bravo", query: "Río Bravo", year: 1959, decade: 1950, director: "Howard Hawks", country: "Estados Unidos" },
  { title: "Los siete samuráis", query: "Los siete samuráis", year: 1954, decade: 1950, director: "Akira Kurosawa", country: "Japón" },
  { title: "Rashōmon", query: "Rashōmon", year: 1950, decade: 1950, director: "Akira Kurosawa", country: "Japón" },
  { title: "El séptimo sello", query: "El séptimo sello", year: 1957, decade: 1950, director: "Ingmar Bergman", country: "Suecia" },
  { title: "Fresas salvajes", query: "Fresas salvajes", year: 1957, decade: 1950, director: "Ingmar Bergman", country: "Suecia" },
  { title: "Sed de mal", query: "Sed de mal", year: 1958, decade: 1950, director: "Orson Welles", country: "Estados Unidos" },
  { title: "Senderos de gloria", query: "Senderos de gloria", year: 1957, decade: 1950, director: "Stanley Kubrick", country: "Estados Unidos" },
  { title: "Con faldas y a lo loco", query: "Con faldas y a lo loco", year: 1959, decade: 1950, director: "Billy Wilder", country: "Estados Unidos" },
  { title: "El crepúsculo de los dioses", query: "El crepúsculo de los dioses", year: 1950, decade: 1950, director: "Billy Wilder", country: "Estados Unidos" },
  { title: "Un lugar en el sol", query: "Un lugar en el sol", year: 1951, decade: 1950, director: "George Stevens", country: "Estados Unidos" },
  { title: "La noche del cazador", query: "La noche del cazador", year: 1955, decade: 1950, director: "Charles Laughton", country: "Estados Unidos" },
  { title: "Gigante", query: "Gigante", year: 1956, decade: 1950, director: "George Stevens", country: "Estados Unidos" },
  { title: "Doce hombres sin piedad", query: "Doce hombres sin piedad", year: 1957, decade: 1950, director: "Sidney Lumet", country: "Estados Unidos" },
  { title: "Vacaciones en Roma", query: "Vacaciones en Roma", year: 1953, decade: 1950, director: "William Wyler", country: "Estados Unidos" },
  { title: "Ben-Hur", query: "Ben-Hur", year: 1959, decade: 1950, director: "William Wyler", country: "Estados Unidos" },
  { title: "Pather Panchali", query: "Pather Panchali", year: 1955, decade: 1950, director: "Satyajit Ray", country: "India" },
  { title: "Cuentos de Tokio", query: "Cuentos de Tokio", year: 1953, decade: 1950, director: "Yasujiro Ozu", country: "Japón" },
  { title: "Cuentos de la luna pálida de agosto", query: "Cuentos de la luna pálida de agosto", year: 1953, decade: 1950, director: "Kenji Mizoguchi", country: "Japón" },
  { title: "Los 400 golpes", query: "Los 400 golpes", year: 1959, decade: 1950, director: "François Truffaut", country: "Francia" },

  // --- 1960s ---
  { title: "Psicosis", query: "Psicosis", year: 1960, decade: 1960, director: "Alfred Hitchcock", country: "Estados Unidos" },
  { title: "Lawrence de Arabia", query: "Lawrence de Arabia", year: 1962, decade: 1960, director: "David Lean", country: "Reino Unido" },
  { title: "El apartamento", query: "El apartamento", year: 1960, decade: 1960, director: "Billy Wilder", country: "Estados Unidos" },
  { title: "8½", query: "Ocho y medio", year: 1963, decade: 1960, director: "Federico Fellini", country: "Italia" },
  { title: "La dolce vita", query: "La dolce vita", year: 1960, decade: 1960, director: "Federico Fellini", country: "Italia" },
  { title: "Doctor Zhivago", query: "Doctor Zhivago", year: 1965, decade: 1960, director: "David Lean", country: "Estados Unidos" },
  { title: "El bueno, el feo y el malo", query: "El bueno, el feo y el malo", year: 1966, decade: 1960, director: "Sergio Leone", country: "Italia" },
  { title: "Por un puñado de dólares", query: "Por un puñado de dólares", year: 1964, decade: 1960, director: "Sergio Leone", country: "Italia" },
  { title: "2001: Una odisea del espacio", query: "2001: Una odisea del espacio", year: 1968, decade: 1960, director: "Stanley Kubrick", country: "Reino Unido" },
  { title: "Dr. Strangelove", query: "Teléfono rojo, volamos hacia Moscú", year: 1964, decade: 1960, director: "Stanley Kubrick", country: "Reino Unido" },
  { title: "Bonnie y Clyde", query: "Bonnie y Clyde", year: 1967, decade: 1960, director: "Arthur Penn", country: "Estados Unidos" },
  { title: "El graduado", query: "El graduado", year: 1967, decade: 1960, director: "Mike Nichols", country: "Estados Unidos" },
  { title: "La noche de los muertos vivientes", query: "La noche de los muertos vivientes", year: 1968, decade: 1960, director: "George A. Romero", country: "Estados Unidos" },
  { title: "La semilla del diablo", query: "La semilla del diablo", year: 1968, decade: 1960, director: "Roman Polanski", country: "Estados Unidos" },
  { title: "El planeta de los simios", query: "El planeta de los simios", year: 1968, decade: 1960, director: "Franklin J. Schaffner", country: "Estados Unidos" },
  { title: "Persona", query: "Persona", year: 1966, decade: 1960, director: "Ingmar Bergman", country: "Suecia" },
  { title: "Sin aliento", query: "Al final de la escapada", year: 1960, decade: 1960, director: "Jean-Luc Godard", country: "Francia" },
  { title: "Jules y Jim", query: "Jules y Jim", year: 1962, decade: 1960, director: "François Truffaut", country: "Francia" },
  { title: "Belle de jour", query: "Belle de jour", year: 1967, decade: 1960, director: "Luis Buñuel", country: "Francia" },
  { title: "Viridiana", query: "Viridiana", year: 1961, decade: 1960, director: "Luis Buñuel", country: "España" },
  { title: "Amores de una rubia", query: "Amores de una rubia", year: 1965, decade: 1960, director: "Milos Forman", country: "Checoslovaquia" },
  { title: "El hombre de Rio", query: "El hombre de Río", year: 1964, decade: 1960, director: "Philippe de Broca", country: "Francia" },
  { title: "Charada", query: "Charada", year: 1963, decade: 1960, director: "Stanley Donen", country: "Estados Unidos" },
  { title: "West Side Story", query: "West Side Story", year: 1961, decade: 1960, director: "Robert Wise", country: "Estados Unidos" },
  { title: "La batalla de Argel", query: "La batalla de Argel", year: 1966, decade: 1960, director: "Gillo Pontecorvo", country: "Italia" },
  { title: "Yojimbo", query: "Yojimbo, el mercenario", year: 1961, decade: 1960, director: "Akira Kurosawa", country: "Japón" },
  { title: "Grupo salvaje", query: "Grupo salvaje", year: 1969, decade: 1960, director: "Sam Peckinpah", country: "Estados Unidos" },

  // --- 1970s ---
  { title: "El padrino", query: "El padrino", year: 1972, decade: 1970, director: "Francis Ford Coppola", country: "Estados Unidos" },
  { title: "El padrino, parte II", query: "El padrino, parte II", year: 1974, decade: 1970, director: "Francis Ford Coppola", country: "Estados Unidos" },
  { title: "Taxi Driver", query: "Taxi Driver", year: 1976, decade: 1970, director: "Martin Scorsese", country: "Estados Unidos" },
  { title: "Apocalypse Now", query: "Apocalypse Now", year: 1979, decade: 1970, director: "Francis Ford Coppola", country: "Estados Unidos" },
  { title: "Chinatown", query: "Chinatown", year: 1974, decade: 1970, director: "Roman Polanski", country: "Estados Unidos" },
  { title: "Annie Hall", query: "Annie Hall", year: 1977, decade: 1970, director: "Woody Allen", country: "Estados Unidos" },
  { title: "La naranja mecánica", query: "La naranja mecánica", year: 1971, decade: 1970, director: "Stanley Kubrick", country: "Reino Unido" },
  { title: "Tiburón", query: "Tiburón", year: 1975, decade: 1970, director: "Steven Spielberg", country: "Estados Unidos" },
  { title: "Encuentros en la tercera fase", query: "Encuentros en la tercera fase", year: 1977, decade: 1970, director: "Steven Spielberg", country: "Estados Unidos" },
  { title: "La guerra de las galaxias", query: "Star Wars: Episodio IV - Una nueva esperanza", year: 1977, decade: 1970, director: "George Lucas", country: "Estados Unidos" },
  { title: "Alien, el octavo pasajero", query: "Alien, el octavo pasajero", year: 1979, decade: 1970, director: "Ridley Scott", country: "Estados Unidos" },
  { title: "El exorcista", query: "El exorcista", year: 1973, decade: 1970, director: "William Friedkin", country: "Estados Unidos" },
  { title: "Network", query: "Network, un mundo implacable", year: 1976, decade: 1970, director: "Sidney Lumet", country: "Estados Unidos" },
  { title: "Perros de paja", query: "Perros de paja", year: 1971, decade: 1970, director: "Sam Peckinpah", country: "Reino Unido" },
  { title: "Solaris", query: "Solaris", year: 1972, decade: 1970, director: "Andréi Tarkovski", country: "URSS" },
  { title: "El espejo", query: "El espejo", year: 1975, decade: 1970, director: "Andréi Tarkovski", country: "URSS" },
  { title: "Amarcord", query: "Amarcord", year: 1973, decade: 1970, director: "Federico Fellini", country: "Italia" },
  { title: "El discreto encanto de la burguesía", query: "El discreto encanto de la burguesía", year: 1972, decade: 1970, director: "Luis Buñuel", country: "Francia" },
  { title: "El espíritu de la colmena", query: "El espíritu de la colmena", year: 1973, decade: 1970, director: "Víctor Erice", country: "España" },
  { title: "Cría cuervos", query: "Cría cuervos", year: 1976, decade: 1970, director: "Carlos Saura", country: "España" },
  { title: "Manhattan", query: "Manhattan", year: 1979, decade: 1970, director: "Woody Allen", country: "Estados Unidos" },
  { title: "Rocky", query: "Rocky", year: 1976, decade: 1970, director: "John G. Avildsen", country: "Estados Unidos" },
  { title: "Fiebre del sábado noche", query: "Fiebre del sábado noche", year: 1977, decade: 1970, director: "John Badham", country: "Estados Unidos" },
  { title: "Dersu Uzala", query: "Dersu Uzala", year: 1975, decade: 1970, director: "Akira Kurosawa", country: "URSS" },
  { title: "Aguirre, la cólera de Dios", query: "Aguirre, la cólera de Dios", year: 1972, decade: 1970, director: "Werner Herzog", country: "Alemania" },

  // --- 1980s ---
  { title: "Blade Runner", query: "Blade Runner", year: 1982, decade: 1980, director: "Ridley Scott", country: "Estados Unidos" },
  { title: "En busca del arca perdida", query: "En busca del arca perdida", year: 1981, decade: 1980, director: "Steven Spielberg", country: "Estados Unidos" },
  { title: "E.T., el extraterrestre", query: "E.T., el extraterrestre", year: 1982, decade: 1980, director: "Steven Spielberg", country: "Estados Unidos" },
  { title: "El imperio contraataca", query: "Star Wars: Episodio V - El imperio contraataca", year: 1980, decade: 1980, director: "Irvin Kershner", country: "Estados Unidos" },
  { title: "El resplandor", query: "El resplandor", year: 1980, decade: 1980, director: "Stanley Kubrick", country: "Reino Unido" },
  { title: "Regreso al futuro", query: "Regreso al futuro", year: 1985, decade: 1980, director: "Robert Zemeckis", country: "Estados Unidos" },
  { title: "Terminator", query: "Terminator", year: 1984, decade: 1980, director: "James Cameron", country: "Estados Unidos" },
  { title: "Toro salvaje", query: "Toro salvaje", year: 1980, decade: 1980, director: "Martin Scorsese", country: "Estados Unidos" },
  { title: "Fanny y Alexander", query: "Fanny y Alexander", year: 1982, decade: 1980, director: "Ingmar Bergman", country: "Suecia" },
  { title: "Paris, Texas", query: "París, Texas", year: 1984, decade: 1980, director: "Wim Wenders", country: "Alemania" },
  { title: "El club de los cinco", query: "El club de los cinco", year: 1985, decade: 1980, director: "John Hughes", country: "Estados Unidos" },
  { title: "Érase una vez en América", query: "Érase una vez en América", year: 1984, decade: 1980, director: "Sergio Leone", country: "Estados Unidos" },
  { title: "Amadeus", query: "Amadeus", year: 1984, decade: 1980, director: "Milos Forman", country: "Estados Unidos" },
  { title: "Cinema Paradiso", query: "Cinema Paradiso", year: 1988, decade: 1980, director: "Giuseppe Tornatore", country: "Italia" },
  { title: "La princesa prometida", query: "La princesa prometida", year: 1987, decade: 1980, director: "Rob Reiner", country: "Estados Unidos" },
  { title: "Akira", query: "Akira", year: 1988, decade: 1980, director: "Katsuhiro Otomo", country: "Japón" },
  { title: "Mi vecino Totoro", query: "Mi vecino Totoro", year: 1988, decade: 1980, director: "Hayao Miyazaki", country: "Japón" },
  { title: "La cosa (El enigma de otro mundo)", query: "La cosa (El enigma de otro mundo)", year: 1982, decade: 1980, director: "John Carpenter", country: "Estados Unidos" },
  { title: "Las amistades peligrosas", query: "Las amistades peligrosas", year: 1988, decade: 1980, director: "Stephen Frears", country: "Reino Unido" },
  { title: "Full Metal Jacket", query: "La chaqueta metálica", year: 1987, decade: 1980, director: "Stanley Kubrick", country: "Reino Unido" },
  { title: "Sacrificio", query: "Sacrificio", year: 1986, decade: 1980, director: "Andréi Tarkovski", country: "Suecia" },
  { title: "La historia interminable", query: "La historia interminable", year: 1984, decade: 1980, director: "Wolfgang Petersen", country: "Alemania" },
  { title: "El color púrpura", query: "El color púrpura", year: 1985, decade: 1980, director: "Steven Spielberg", country: "Estados Unidos" },
  { title: "Mujeres al borde de un ataque de nervios", query: "Mujeres al borde de un ataque de nervios", year: 1988, decade: 1980, director: "Pedro Almodóvar", country: "España" },
  { title: "El precio del poder", query: "El precio del poder", year: 1983, decade: 1980, director: "Brian De Palma", country: "Estados Unidos" },
  { title: "Das Boot (El submarino)", query: "Das Boot (El submarino)", year: 1981, decade: 1980, director: "Wolfgang Petersen", country: "Alemania" },

  // --- 1990s ---
  { title: "GoodFellas (Uno de los nuestros)", query: "GoodFellas", year: 1990, decade: 1990, director: "Martin Scorsese", country: "Estados Unidos" },
  { title: "El silencio de los corderos", query: "El silencio de los corderos", year: 1991, decade: 1990, director: "Jonathan Demme", country: "Estados Unidos" },
  { title: "Pulp Fiction", query: "Pulp Fiction", year: 1994, decade: 1990, director: "Quentin Tarantino", country: "Estados Unidos" },
  { title: "Reservoir Dogs", query: "Reservoir Dogs", year: 1992, decade: 1990, director: "Quentin Tarantino", country: "Estados Unidos" },
  { title: "Cadena perpetua", query: "Cadena perpetua", year: 1994, decade: 1990, director: "Frank Darabont", country: "Estados Unidos" },
  { title: "Forrest Gump", query: "Forrest Gump", year: 1994, decade: 1990, director: "Robert Zemeckis", country: "Estados Unidos" },
  { title: "Parque Jurásico", query: "Parque Jurásico", year: 1993, decade: 1990, director: "Steven Spielberg", country: "Estados Unidos" },
  { title: "La lista de Schindler", query: "La lista de Schindler", year: 1993, decade: 1990, director: "Steven Spielberg", country: "Estados Unidos" },
  { title: "Terminator 2: El juicio final", query: "Terminator 2: El juicio final", year: 1991, decade: 1990, director: "James Cameron", country: "Estados Unidos" },
  { title: "Titanic", query: "Titanic", year: 1997, decade: 1990, director: "James Cameron", country: "Estados Unidos" },
  { title: "Sentido y sensibilidad", query: "Sentido y sensibilidad", year: 1995, decade: 1990, director: "Ang Lee", country: "Reino Unido" },
  { title: "El sexto sentido", query: "El sexto sentido", year: 1999, decade: 1990, director: "M. Night Shyamalan", country: "Estados Unidos" },
  { title: "Matrix", query: "Matrix", year: 1999, decade: 1990, director: "Lana Wachowski", country: "Estados Unidos" },
  { title: "Seven", query: "Seven", year: 1995, decade: 1990, director: "David Fincher", country: "Estados Unidos" },
  { title: "El club de la lucha", query: "El club de la lucha", year: 1999, decade: 1990, director: "David Fincher", country: "Estados Unidos" },
  { title: "American Beauty", query: "American Beauty", year: 1999, decade: 1990, director: "Sam Mendes", country: "Estados Unidos" },
  { title: "Magnolia", query: "Magnolia", year: 1999, decade: 1990, director: "Paul Thomas Anderson", country: "Estados Unidos" },
  { title: "Breaking the Waves", query: "Rompiendo las olas", year: 1996, decade: 1990, director: "Lars von Trier", country: "Dinamarca" },
  { title: "La doble vida de Verónica", query: "La doble vida de Verónica", year: 1991, decade: 1990, director: "Krzysztof Kieslowski", country: "Francia" },
  { title: "Tres colores: Azul", query: "Tres colores: Azul", year: 1993, decade: 1990, director: "Krzysztof Kieslowski", country: "Francia" },
  { title: "La princesa Mononoke", query: "La princesa Mononoke", year: 1997, decade: 1990, director: "Hayao Miyazaki", country: "Japón" },
  { title: "Vivir del cuento (Toy Story)", query: "Toy Story", year: 1995, decade: 1990, director: "John Lasseter", country: "Estados Unidos" },
  { title: "Todo sobre mi madre", query: "Todo sobre mi madre", year: 1999, decade: 1990, director: "Pedro Almodóvar", country: "España" },
  { title: "Tacones lejanos", query: "Tacones lejanos", year: 1991, decade: 1990, director: "Pedro Almodóvar", country: "España" },
  { title: "Trainspotting", query: "Trainspotting", year: 1996, decade: 1990, director: "Danny Boyle", country: "Reino Unido" },
  { title: "Fargo", query: "Fargo", year: 1996, decade: 1990, director: "Joel Coen", country: "Estados Unidos" },
  { title: "El gran Lebowski", query: "El gran Lebowski", year: 1998, decade: 1990, director: "Joel Coen", country: "Estados Unidos" },
  { title: "Heat", query: "Heat", year: 1995, decade: 1990, director: "Michael Mann", country: "Estados Unidos" },
  { title: "La vida es bella", query: "La vida es bella", year: 1997, decade: 1990, director: "Roberto Benigni", country: "Italia" },
  { title: "Chungking Express", query: "Chungking Express", year: 1994, decade: 1990, director: "Wong Kar-wai", country: "Hong Kong" },
  { title: "Thelma y Louise", query: "Thelma y Louise", year: 1991, decade: 1990, director: "Ridley Scott", country: "Estados Unidos" },

  // --- 2000s ---
  { title: "El señor de los anillos: La comunidad del anillo", query: "El señor de los anillos: La comunidad del anillo", year: 2001, decade: 2000, director: "Peter Jackson", country: "Nueva Zelanda" },
  { title: "El señor de los anillos: El retorno del rey", query: "El señor de los anillos: El retorno del rey", year: 2003, decade: 2000, director: "Peter Jackson", country: "Nueva Zelanda" },
  { title: "Memento", query: "Memento", year: 2000, decade: 2000, director: "Christopher Nolan", country: "Estados Unidos" },
  { title: "Mulholland Drive", query: "Mulholland Drive", year: 2001, decade: 2000, director: "David Lynch", country: "Estados Unidos" },
  { title: "Amélie", query: "Amélie", year: 2001, decade: 2000, director: "Jean-Pierre Jeunet", country: "Francia" },
  { title: "Ciudad de Dios", query: "Ciudad de Dios", year: 2002, decade: 2000, director: "Fernando Meirelles", country: "Brasil" },
  { title: "El pianista", query: "El pianista", year: 2002, decade: 2000, director: "Roman Polanski", country: "Francia" },
  { title: "Infernal Affairs", query: "Infernal Affairs", year: 2002, decade: 2000, director: "Andrew Lau", country: "Hong Kong" },
  { title: "Oldboy", query: "Oldboy", year: 2003, decade: 2000, director: "Park Chan-wook", country: "Corea del Sur" },
  { title: "Kill Bill: Volumen 1", query: "Kill Bill: Volumen 1", year: 2003, decade: 2000, director: "Quentin Tarantino", country: "Estados Unidos" },
  { title: "Eterno resplandor de una mente sin recuerdos", query: "Eterno resplandor de una mente sin recuerdos", year: 2004, decade: 2000, director: "Michel Gondry", country: "Estados Unidos" },
  { title: "Million Dollar Baby", query: "Million Dollar Baby", year: 2004, decade: 2000, director: "Clint Eastwood", country: "Estados Unidos" },
  { title: "Mar adentro", query: "Mar adentro", year: 2004, decade: 2000, director: "Alejandro Amenábar", country: "España" },
  { title: "Volver", query: "Volver", year: 2006, decade: 2000, director: "Pedro Almodóvar", country: "España" },
  { title: "El laberinto del fauno", query: "El laberinto del fauno", year: 2006, decade: 2000, director: "Guillermo del Toro", country: "España" },
  { title: "No es país para viejos", query: "No es país para viejos", year: 2007, decade: 2000, director: "Joel Coen", country: "Estados Unidos" },
  { title: "Pozos de ambición", query: "Pozos de ambición", year: 2007, decade: 2000, director: "Paul Thomas Anderson", country: "Estados Unidos" },
  { title: "El caballero oscuro", query: "El caballero oscuro", year: 2008, decade: 2000, director: "Christopher Nolan", country: "Estados Unidos" },
  { title: "Up", query: "Up", year: 2009, decade: 2000, director: "Pete Docter", country: "Estados Unidos" },
  { title: "Wall·E", query: "Wall·E", year: 2008, decade: 2000, director: "Andrew Stanton", country: "Estados Unidos" },
  { title: "Los Increíbles", query: "Los Increíbles", year: 2004, decade: 2000, director: "Brad Bird", country: "Estados Unidos" },
  { title: "El castillo ambulante", query: "El castillo ambulante", year: 2004, decade: 2000, director: "Hayao Miyazaki", country: "Japón" },
  { title: "El viaje de Chihiro", query: "El viaje de Chihiro", year: 2001, decade: 2000, director: "Hayao Miyazaki", country: "Japón" },
  { title: "Niños del hombre", query: "Hijos de los hombres", year: 2006, decade: 2000, director: "Alfonso Cuarón", country: "Reino Unido" },
  { title: "Y tu mamá también", query: "Y tu mamá también", year: 2001, decade: 2000, director: "Alfonso Cuarón", country: "México" },
  { title: "Amores perros", query: "Amores perros", year: 2000, decade: 2000, director: "Alejandro González Iñárritu", country: "México" },
  { title: "Babel", query: "Babel", year: 2006, decade: 2000, director: "Alejandro González Iñárritu", country: "México" },
  { title: "Hable con ella", query: "Hable con ella", year: 2002, decade: 2000, director: "Pedro Almodóvar", country: "España" },
  { title: "Deseando amar", query: "Deseando amar", year: 2000, decade: 2000, director: "Wong Kar-wai", country: "Hong Kong" },
  { title: "El truco final", query: "El truco final", year: 2006, decade: 2000, director: "Christopher Nolan", country: "Estados Unidos" },

  // --- 2010s ---
  { title: "La red social", query: "La red social", year: 2010, decade: 2010, director: "David Fincher", country: "Estados Unidos" },
  { title: "El origen", query: "Origen", year: 2010, decade: 2010, director: "Christopher Nolan", country: "Estados Unidos" },
  { title: "Interstellar", query: "Interstellar", year: 2014, decade: 2010, director: "Christopher Nolan", country: "Estados Unidos" },
  { title: "Her", query: "Her", year: 2013, decade: 2010, director: "Spike Jonze", country: "Estados Unidos" },
  { title: "Whiplash", query: "Whiplash", year: 2014, decade: 2010, director: "Damien Chazelle", country: "Estados Unidos" },
  { title: "La La Land", query: "La La Land: Una historia de amor", year: 2016, decade: 2010, director: "Damien Chazelle", country: "Estados Unidos" },
  { title: "Boyhood (Momentos de una vida)", query: "Boyhood (Momentos de una vida)", year: 2014, decade: 2010, director: "Richard Linklater", country: "Estados Unidos" },
  { title: "12 años de esclavitud", query: "12 años de esclavitud", year: 2013, decade: 2010, director: "Steve McQueen", country: "Reino Unido" },
  { title: "Birdman", query: "Birdman o (la inesperada virtud de la ignorancia)", year: 2014, decade: 2010, director: "Alejandro González Iñárritu", country: "Estados Unidos" },
  { title: "El renacido", query: "El renacido", year: 2015, decade: 2010, director: "Alejandro González Iñárritu", country: "Estados Unidos" },
  { title: "Gravity", query: "Gravity", year: 2013, decade: 2010, director: "Alfonso Cuarón", country: "Reino Unido" },
  { title: "Roma", query: "Roma", year: 2018, decade: 2010, director: "Alfonso Cuarón", country: "México" },
  { title: "Mad Max: Furia en la carretera", query: "Mad Max: Furia en la carretera", year: 2015, decade: 2010, director: "George Miller", country: "Australia" },
  { title: "Llegada", query: "La llegada", year: 2016, decade: 2010, director: "Denis Villeneuve", country: "Estados Unidos" },
  { title: "Blade Runner 2049", query: "Blade Runner 2049", year: 2017, decade: 2010, director: "Denis Villeneuve", country: "Estados Unidos" },
  { title: "Dunkerque", query: "Dunkerque", year: 2017, decade: 2010, director: "Christopher Nolan", country: "Reino Unido" },
  { title: "Moonlight", query: "Moonlight (Luz de luna)", year: 2016, decade: 2010, director: "Barry Jenkins", country: "Estados Unidos" },
  { title: "Déjame salir", query: "Déjame salir", year: 2017, decade: 2010, director: "Jordan Peele", country: "Estados Unidos" },
  { title: "Spider-Man: Un nuevo universo", query: "Spider-Man: Un nuevo universo", year: 2018, decade: 2010, director: "Bob Persichetti", country: "Estados Unidos" },
  { title: "Your Name", query: "Your Name", year: 2016, decade: 2010, director: "Makoto Shinkai", country: "Japón" },
  { title: "El hilo invisible", query: "El hilo invisible", year: 2017, decade: 2010, director: "Paul Thomas Anderson", country: "Estados Unidos" },
  { title: "Érase una vez en... Hollywood", query: "Érase una vez en... Hollywood", year: 2019, decade: 2010, director: "Quentin Tarantino", country: "Estados Unidos" },
  { title: "Parásitos", query: "Parásitos", year: 2019, decade: 2010, director: "Bong Joon-ho", country: "Corea del Sur" },
  { title: "Joker", query: "Joker", year: 2019, decade: 2010, director: "Todd Phillips", country: "Estados Unidos" },
  { title: "Historia de un matrimonio", query: "Historia de un matrimonio", year: 2019, decade: 2010, director: "Noah Baumbach", country: "Estados Unidos" },
  { title: "Vengadores: Endgame", query: "Vengadores: Endgame", year: 2019, decade: 2010, director: "Anthony Russo", country: "Estados Unidos" },
  { title: "El árbol de la vida", query: "El árbol de la vida", year: 2011, decade: 2010, director: "Terrence Malick", country: "Estados Unidos" },
  { title: "Carol", query: "Carol", year: 2015, decade: 2010, director: "Todd Haynes", country: "Estados Unidos" },
  { title: "El gran Hotel Budapest", query: "El gran Hotel Budapest", year: 2014, decade: 2010, director: "Wes Anderson", country: "Estados Unidos" },
  { title: "Relatos salvajes", query: "Relatos salvajes", year: 2014, decade: 2010, director: "Damián Szifron", country: "Argentina" },
  { title: "Call Me by Your Name", query: "Call Me by Your Name", year: 2017, decade: 2010, director: "Luca Guadagnino", country: "Italia" },
  { title: "Lady Bird", query: "Lady Bird", year: 2017, decade: 2010, director: "Greta Gerwig", country: "Estados Unidos" },
  { title: "Coco", query: "Coco", year: 2017, decade: 2010, director: "Lee Unkrich", country: "Estados Unidos" },

  // --- 2020s ---
  { title: "Nomadland", query: "Nomadland", year: 2020, decade: 2020, director: "Chloé Zhao", country: "Estados Unidos" },
  { title: "El poder del perro", query: "El poder del perro", year: 2021, decade: 2020, director: "Jane Campion", country: "Nueva Zelanda" },
  { title: "CODA", query: "CODA: Los sonidos del silencio", year: 2021, decade: 2020, director: "Sian Heder", country: "Estados Unidos" },
  { title: "Todo a la vez en todas partes", query: "Todo a la vez en todas partes", year: 2022, decade: 2020, director: "Daniel Kwan", country: "Estados Unidos" },
  { title: "Belfast", query: "Belfast", year: 2021, decade: 2020, director: "Kenneth Branagh", country: "Reino Unido" },
  { title: "Licorice Pizza", query: "Licorice Pizza", year: 2021, decade: 2020, director: "Paul Thomas Anderson", country: "Estados Unidos" },
  { title: "Drive My Car", query: "Drive My Car", year: 2021, decade: 2020, director: "Ryusuke Hamaguchi", country: "Japón" },
  { title: "Sin novedad en el frente", query: "Sin novedad en el frente", year: 2022, decade: 2020, director: "Edward Berger", country: "Alemania" },
  { title: "Tár", query: "Tár", year: 2022, decade: 2020, director: "Todd Field", country: "Estados Unidos" },
  { title: "Los espíritus de la isla", query: "Los espíritus de la isla", year: 2022, decade: 2020, director: "Martin McDonagh", country: "Irlanda" },
  { title: "Top Gun: Maverick", query: "Top Gun: Maverick", year: 2022, decade: 2020, director: "Joseph Kosinski", country: "Estados Unidos" },
  { title: "Oppenheimer", query: "Oppenheimer", year: 2023, decade: 2020, director: "Christopher Nolan", country: "Estados Unidos" },
  { title: "Pobres criaturas", query: "Pobres criaturas", year: 2023, decade: 2020, director: "Yorgos Lanthimos", country: "Reino Unido" },
  { title: "Vidas pasadas", query: "Vidas pasadas", year: 2023, decade: 2020, director: "Celine Song", country: "Estados Unidos" },
  { title: "Zona de interés", query: "Zona de interés", year: 2023, decade: 2020, director: "Jonathan Glazer", country: "Reino Unido" },
  { title: "Anatomía de una caída", query: "Anatomía de una caída", year: 2023, decade: 2020, director: "Justine Triet", country: "Francia" },
  { title: "Dune", query: "Dune", year: 2021, decade: 2020, director: "Denis Villeneuve", country: "Estados Unidos" },
  { title: "Dune: Parte dos", query: "Dune: Parte dos", year: 2024, decade: 2020, director: "Denis Villeneuve", country: "Estados Unidos" },
  { title: "El brutalista", query: "El brutalista", year: 2024, decade: 2020, director: "Brady Corbet", country: "Estados Unidos" },
  { title: "Un completo desconocido", query: "Un completo desconocido", year: 2024, decade: 2020, director: "James Mangold", country: "Estados Unidos" },
  { title: "Barbie", query: "Barbie", year: 2023, decade: 2020, director: "Greta Gerwig", country: "Estados Unidos" },
  { title: "La sociedad de la nieve", query: "La sociedad de la nieve", year: 2023, decade: 2020, director: "J. A. Bayona", country: "España" },
];
