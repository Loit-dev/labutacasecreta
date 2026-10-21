"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  title: string;
  /** Texto pequeño sobre el título (por ejemplo, "Pregunta 2 de 5") */
  eyebrow?: string;
  children: ReactNode;
  tone?: "neutral" | "good";
};

/**
 * Una pantalla del modo acompañado. Al aparecer lleva el foco al título,
 * para que quien usa lector de pantalla sepa que ha cambiado.
 */
export default function Panel({
  title,
  eyebrow,
  children,
  tone = "neutral",
}: Props) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      className={`rounded-2xl border px-5 py-6 transition-colors ${
        tone === "good"
          ? "border-emerald-400/50 bg-emerald-500/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      {eyebrow && (
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {eyebrow}
        </p>
      )}

      <h2
        ref={heading}
        tabIndex={-1}
        className="mt-1 text-center text-xl font-bold text-white outline-none"
        style={{ fontFamily: "var(--font-manrope)" }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}
