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

  // Todos los botones de opciones se ven exactamente igual: alineados
  // a la izquierda y con la flechita, sin excepciones ni botones
  // sueltos centrados (incluida la última opción cuando el número de
  // opciones es impar).
  return (
    <div
      data-options
      className="mt-6 grid gap-2 md:grid-cols-2"
    >
      {question.options.map((option) => (
        <AnswerButton
          key={option.id}
          label={option.label}
          onClick={() =>
            onSelect(option.value, option.label)
          }
        />
      ))}
    </div>
  );
}