import type { ChatConversation } from "@rearden/types";
import { useChat } from "@/contexts/ChatContext";
import styles from "./ChatConversationItem.module.scss";

interface ChatConversationItemProps {
  conversation: ChatConversation;
  isActive: boolean;
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

export function ChatConversationItem({
  conversation,
  isActive,
  onSelect,
}: ChatConversationItemProps) {
  const { togglePin } = useChat();

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(conversation.id);
  };

  return (
    <button
      className={`${styles.item} ${isActive ? styles.active : ""}`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className={styles.avatar}>
        {conversation.candidateName.charAt(0)}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>{conversation.candidateName}</span>
          <div className={styles.meta}>
            {conversation.isPinned && (
              <svg
                className={styles.pinned}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <path d="M16 3a1 1 0 0 1 .117 1.993L16 5H14.28l-.719 4.32A4.003 4.003 0 0 1 16.5 13c0 .614-.138 1.196-.386 1.717l-.156.283H14v6a1 1 0 0 1-1.993.117L12 21v-6H8.042l-.156-.283A3.97 3.97 0 0 1 7.5 13a4.003 4.003 0 0 1 2.94-3.858L9.72 5H8a1 1 0 0 1-.117-1.993L8 3h8z" />
              </svg>
            )}
            {conversation.lastMessage && (
              <span className={styles.time}>
                {timeAgo(conversation.lastMessage.createdAt)}
              </span>
            )}
          </div>
        </div>
        {conversation.lastMessage && (
          <p className={styles.preview}>{conversation.lastMessage.text}</p>
        )}
      </div>

      <div className={styles.actions}>
        {conversation.unreadCount > 0 && (
          <span className={styles.unreadBadge}>{conversation.unreadCount}</span>
        )}
        <button
          className={`${styles.pinButton} ${conversation.isPinned ? styles.isPinned : ""}`}
          onClick={handlePin}
          title={conversation.isPinned ? "Unpin" : "Pin"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="17" x2="12" y2="22" />
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
          </svg>
        </button>
      </div>
    </button>
  );
}
