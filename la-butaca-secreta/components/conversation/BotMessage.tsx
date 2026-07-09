import Image from "next/image";

type Props = {
  text: string;
};

export default function BotMessage({ text }: Props) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          border-zinc-700
          bg-zinc-900
          shadow-lg
        "
      >
        <Image
          src="/logito.png"
          alt="La Butaca Secreta"
          width={24}
          height={24}
          className="object-contain"
          priority
        />
      </div>

      <div
        className="
          max-w-[80%]
          rounded-3xl
          rounded-tl-md
          border
          border-zinc-700
          bg-zinc-800
          px-5
          py-4
          text-white
          shadow-md
        "
      >
        {text}
      </div>
    </div>
  );
}