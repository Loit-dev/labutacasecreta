import { getTitle } from "@/lib/conversation/personality";

export default function Header() {
  return (
    <header className="mb-12 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight">
        {getTitle()}
      </h1>

      <p className="mt-4 text-lg text-zinc-400">
        Tu amigo cinéfilo para encontrar qué ver sin perder media hora buscando.
      </p>
    </header>
  );
}