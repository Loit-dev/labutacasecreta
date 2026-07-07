import RecommendationCard from "./RecommendationCard";

export default function Recommendations() {
  return (
    <section className="space-y-6">

      <h2 className="text-3xl font-bold">
        🎬 Creo que estas tres pueden ser justo lo que buscas.
      </h2>

      <RecommendationCard
        medal="🥇"
        title="Interstellar"
        subtitle="Mi apuesta para ti"
        description="Una historia enorme de ciencia ficción con emoción, aventura y una banda sonora espectacular."
      />

      <RecommendationCard
        medal="🥈"
        title="Whiplash"
        subtitle="Otra que creo que disfrutarás"
        description="Intensa, absorbente y con un ritmo que no da tregua."
      />

      <RecommendationCard
        medal="🥉"
        title="Prisoners"
        subtitle="Una sorpresa que merece una oportunidad"
        description="Un thriller oscuro que probablemente siga rondándote la cabeza cuando termine."
      />

    </section>
  );
}