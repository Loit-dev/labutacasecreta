import Image from "next/image";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div
        className="
          flex
          h-12
          w-12
          items-center
          justify-center
          overflow-hidden
          rounded-full
          border
          border-zinc-700
          bg-black
          shadow-lg
        "
      >
              <Image
          src="/logito.png"
          alt="La Butaca Secreta"
          width={40}
          height={40}
          className="object-contain scale-110"
          priority
        />
      </div>

      <div
        className="
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900/80
          px-4
          py-3
        "
      >
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" />
        </div>
      </div>
    </div>
  );
}