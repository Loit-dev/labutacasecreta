import { ConversationNode } from "@/lib/conversation/types";
import AnswerButton from "./AnswerButton";

type Props = {
  question: ConversationNode | null;
  onSelect: (
    value: string,
    label: string
  ) => void;
};

export default function OptionButtons({
  question,
  onSelect,
}: Props) {
  if (!question) return null;

  return (
    <div className="mt-8 flex flex-col gap-4">
      {question.options.map((option) => (
        <AnswerButton
          key={option.id}
          label={option.label}
          onClick={() =>
            onSelect(
              option.value,
              option.label
            )
          }
        />
      ))}
    </div>
  );
}