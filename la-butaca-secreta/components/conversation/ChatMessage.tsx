import BotMessage from "./BotMessage";
import UserMessage from "./UserMessage";

type Props = {
  sender: "bot" | "user";
  text: string;
};

export default function ChatMessage({
  sender,
  text,
}: Props) {
  if (sender === "bot") {
    return <BotMessage text={text} />;
  }

  return <UserMessage text={text} />;
}