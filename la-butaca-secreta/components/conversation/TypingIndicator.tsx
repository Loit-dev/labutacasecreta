import Image from "next/image";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          border
          border-zinc-700
          bg-zinc-900
          shadow-lg
        "
      >
        <Image
          src="/logito.png"
          alt="La Butaca Secreta"
          width={26}
          height={26}
          className="object-contain"
          priority
        />
      </div>

      <div className="rounded-3xl rounded-bl-md border border-zinc-700 bg-zinc-800 px-5 py-4 shadow-lg">
        <div className="flex gap-2">
          <span
            className="h-2.5 w-2.5 animate-bounce rounded-full bg-red-500"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2.5 w-2.5 animate-bounce rounded-full bg-red-500"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-2.5 w-2.5 animate-bounce rounded-full bg-red-500"
            style={{ animationDelay: "300ms" }}
          />
        </div>

        <p className="mt-3 text-sm text-zinc-400">
          Buscando la mejor opción para ti...
        </p>
      </div>
    </div>
  );
}