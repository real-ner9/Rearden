import type { ChatMessage } from "@rearden/types";
import styles from "./ChatMessageBubble.module.scss";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isMine = message.senderRole === "recruiter";

  return (
    <div className={`${styles.message} ${isMine ? styles.mine : styles.theirs}`}>
      <div className={styles.bubble}>
        <p className={styles.text}>{message.text}</p>
        <span className={styles.time}>{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
