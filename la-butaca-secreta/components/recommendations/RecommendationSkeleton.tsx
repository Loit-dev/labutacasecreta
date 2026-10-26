"use client";

import { useEffect, useState } from "react";

import { ClapperIcon } from "@/components/icons/Icons";

const MESSAGES = [
  "Revisando el catálogo con lupa…",
  "Descartando lo que ya has visto veinte veces…",
  "Buscando algo que encaje con tu plan…",
  "Preguntando en la sala 7 qué merece la pena…",
  "Eligiendo una sorpresa que valga la pena…",
  "Ya casi: apagando las luces y subiendo el telón…",
];

type Props = {
  // Versión corta para cuando solo se esperan "más" recomendaciones
  compact?: boolean;
};

export default function RecommendationSkeleton({
  compact = false,
}: Props) {
  const [index, setIndex] = useState(0);

  // Cambia el mensaje cada par de segundos (se queda en el último)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) =>
        Math.min(current + 1, MESSAGES.length - 1)
      );
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className="space-y-6"
      aria-busy="true"
    >
      <p
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-1.5 text-center text-zinc-300"
      >
        <ClapperIcon size={15} />
        {compact
          ? "Buscando más recomendaciones…"
          : MESSAGES[index]}
      </p>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((slot) => (
          <div
            key={slot}
            className={`overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 motion-safe:animate-pulse ${
              slot === 0
                ? ""
                : "hidden md:block"
            } ${slot === 2 ? "md:hidden xl:block" : ""}`}
          >
            <div className="h-56 bg-zinc-800" />

            <div className="space-y-3 p-4">
              <div className="h-3 w-1/2 rounded bg-zinc-800" />

              <div className="h-5 w-3/4 rounded bg-zinc-800" />

              <div className="h-3 w-full rounded bg-zinc-800" />

              <div className="h-3 w-5/6 rounded bg-zinc-800" />

              <div className="h-10 rounded-xl bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
