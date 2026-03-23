import type { ChatConversation } from "@rearden/types";
import styles from "./ConversationList.module.scss";

interface ConversationListProps {
  conversations: ChatConversation[];
  onSelect: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ConversationList({ conversations, onSelect }: ConversationListProps) {
  return (
    <div className={styles.list}>
      {conversations.map((conv) => (
        <button
          key={conv.id}
          className={styles.item}
          onClick={() => onSelect(conv.id)}
        >
          <div className={styles.avatar}>{conv.candidateName.charAt(0)}</div>
          <div className={styles.content}>
            <div className={styles.header}>
              <span className={styles.name}>{conv.candidateName}</span>
              {conv.lastMessage && (
                <span className={styles.time}>{timeAgo(conv.lastMessage.createdAt)}</span>
              )}
            </div>
            {conv.lastMessage && (
              <p className={styles.preview}>{conv.lastMessage.text}</p>
            )}
          </div>
          {conv.unreadCount > 0 && (
            <span className={styles.unreadBadge}>{conv.unreadCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}
