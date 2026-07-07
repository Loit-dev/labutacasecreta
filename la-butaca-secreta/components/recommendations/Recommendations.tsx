import RecommendationCard from "./RecommendationCard";

export default function Recommendations() {
  return (
    <section className="space-y-8">

      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">
          🎬 Creo que estas tres pueden ser justo lo que buscas.
        </h1>

        <p className="mt-4 text-lg text-zinc-400">
          No son las más famosas. Son las que creo que más puedes disfrutar hoy.
        </p>
      </div>

      <RecommendationCard
        badge="🥇"
        badgeTitle="Mi apuesta para ti"
        title="Interstellar"
        year={2014}
        rating={8.7}
        runtime={169}
        genres={[
          "Ciencia ficción",
          "Drama",
        ]}
        overview="Un viaje épico a través del espacio y el tiempo donde un grupo de astronautas busca un nuevo hogar para la humanidad."
        poster="https://image.tmdb.org/t/p/w500/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg"
      />

      <RecommendationCard
        badge="🥈"
        badgeTitle="Otra que creo que disfrutarás"
        title="Whiplash"
        year={2014}
        rating={8.5}
        runtime={107}
        genres={[
          "Drama",
          "Música",
        ]}
        overview="La obsesión por alcanzar la perfección lleva a un joven batería a una intensa relación con su exigente profesor."
        poster="https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg"
      />

      <RecommendationCard
        badge="🥉"
        badgeTitle="Una sorpresa que merece una oportunidad"
        title="Prisoners"
        year={2013}
        rating={8.1}
        runtime={153}
        genres={[
          "Thriller",
          "Drama",
        ]}
        overview="La desaparición de dos niñas desencadena una investigación llena de tensión, decisiones difíciles y giros inesperados."
        poster="https://image.tmdb.org/t/p/w500/uhviyknTT5cEQXbn6vWIqfM4vGm.jpg"
      />

    </section>
  );
}