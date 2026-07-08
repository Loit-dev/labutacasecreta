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

  const isOdd =
    question.options.length % 2 !== 0;

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {question.options.map((option, index) => {
        const isLast =
          index === question.options.length - 1;

        const centered =
          isOdd && isLast;

        return (
          <div
            key={option.id}
            className={
              centered
                ? "md:col-span-2"
                : ""
            }
          >
            <AnswerButton
              label={option.label}
              centered={centered}
              onClick={() =>
                onSelect(
                  option.value,
                  option.label
                )
              }
            />
          </div>
        );
      })}
    </div>
  );
}