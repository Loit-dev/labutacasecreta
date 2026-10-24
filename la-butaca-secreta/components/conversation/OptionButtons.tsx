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

  // "¿Qué te apetece ver?" tenía un número par de opciones y nunca
  // centraba ninguna; al añadir "Anime" pasó a ser impar y el botón
  // se centraba solo, sin flecha, distinto a los demás. Se deja sin
  // el efecto de "última opción suelta centrada" aquí para que todos
  // los botones de género se vean exactamente igual.
  const isOdd =
    question.id !== "preferredGenre" &&
    question.options.length % 2 !== 0;

  return (
    <div
      data-options
      className="mt-6 grid gap-2 md:grid-cols-2"
    >
      {question.options.map(
        (option, index) => {
          const isLast =
            index ===
            question.options.length - 1;

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
        }
      )}
    </div>
  );
}