type Props = {
  children: React.ReactNode;
};

export default function UserMessage({ children }: Props) {
  return (
    <div className="flex justify-end">
      <div
        className="
          max-w-[80%]
          rounded-3xl
          rounded-br-md
          bg-gradient-to-b
          from-yellow-300
          to-yellow-400
          px-5
          py-4
          text-black
          font-bold
          shadow-lg
        "
      >
        {children}
      </div>
    </div>
  );
}