"use client";

import Header from "./Header";
import ChatHistory from "./ChatHistory";
import OptionButtons from "./OptionButtons";
import TypingIndicator from "./TypingIndicator";

import Recommendations from "@/components/recommendations/Recommendations";
import { useConversation } from "@/hooks/useConversation";

export default function Conversation() {
  const {
    messages,
    profile,
    currentQuestion,
    answer,
    isThinking,
    finished,
  } = useConversation();

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center overflow-hidden px-6 py-10">
      {/* Fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#7c2d12_0%,transparent_35%),radial-gradient(circle_at_bottom,#1e3a8a_0%,transparent_35%)] opacity-40" />

      <section className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
        {/* HERO */}
        <div className="border-b border-white/10 px-8 py-12">
          <Header />

          <div className="mt-8 text-center">
            <h1 className="text-5xl font-black tracking-tight text-white">
              Descubre historias increíbles
              <br />
              hechas para ti.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              Responde unas preguntas y encontraremos algo que realmente te
              apetezca ver esta noche.
            </p>

            {/* Plataformas */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                "Netflix",
                "Prime Video",
                "Disney+",
                "Max",
                "Apple TV+",
                "Filmin",
              ].map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300"
                >
                  {platform}
                </span>
              ))}
            </div>

            {/* Tendencias */}
            <div className="mt-10">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                🔥 Tendencias esta semana
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Dune",
                  "The Bear",
                  "Shōgun",
                  "Dark",
                  "Interstellar",
                  "The Last of Us",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:border-red-500/50 hover:bg-white/10"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CHAT */}
        <div className="px-8 py-8">
          <ChatHistory messages={messages} />

          {isThinking && (
            <div className="mt-8">
              <TypingIndicator />
            </div>
          )}

          {!finished && !isThinking && (
            <div className="mt-8">
              <OptionButtons
                question={currentQuestion}
                onSelect={answer}
              />
            </div>
          )}

          {finished && (
            <div className="mt-10">
              <Recommendations profile={profile} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}