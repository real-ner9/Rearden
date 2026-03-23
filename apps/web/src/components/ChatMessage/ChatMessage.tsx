import type { ChatMessage as ChatMessageType } from "@rearden/types";
import styles from "./ChatMessage.module.scss";

interface ChatMessageProps {
  message: ChatMessageType;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessage({ message }: ChatMessageProps) {
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
