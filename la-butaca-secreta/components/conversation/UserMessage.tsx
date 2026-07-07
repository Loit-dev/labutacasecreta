type Props = {
  text: string;
};

export default function UserMessage({ text }: Props) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-3xl rounded-br-md bg-yellow-400 px-5 py-4 font-semibold text-black shadow-md">
        {text}
      </div>
    </div>
  );
}