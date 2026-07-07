type Props = {
  medal: string;
  title: string;
  subtitle: string;
  description: string;
};

export default function RecommendationCard({
  medal,
  title,
  subtitle,
  description,
}: Props) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="text-3xl">{medal}</div>

      <h3 className="mt-3 text-2xl font-bold text-white">
        {title}
      </h3>

      <p className="mt-1 text-yellow-300 font-semibold">
        {subtitle}
      </p>

      <p className="mt-4 text-zinc-300 leading-relaxed">
        {description}
      </p>
    </div>
  );
}