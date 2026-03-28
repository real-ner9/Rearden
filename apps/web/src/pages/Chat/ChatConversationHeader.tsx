import { Link } from "react-router-dom";
import { useChatStore, selectActiveConversation } from "@/stores/chatStore";
import styles from "./ChatConversationHeader.module.scss";

export function ChatConversationHeader() {
  const activeConversation = useChatStore(selectActiveConversation);
  const closeConversation = useChatStore((s) => s.closeConversation);
  const togglePin = useChatStore((s) => s.togglePin);
  const setMessageSearchOpen = useChatStore((s) => s.setMessageSearchOpen);

  if (!activeConversation) return null;

  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={closeConversation}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className={styles.avatar}>
        {activeConversation.userName.charAt(0)}
      </div>

      <Link to={`/user/${activeConversation.userId}`} className={styles.info}>
        <h3 className={styles.name}>{activeConversation.userName}</h3>
      </Link>

      <button
        className={styles.searchBtn}
        onClick={() => setMessageSearchOpen(true)}
        title="Search messages"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      <button
        className={`${styles.pinToggle} ${activeConversation.isPinned ? styles.isPinned : ""}`}
        onClick={() => togglePin(activeConversation.id)}
        title={activeConversation.isPinned ? "Unpin conversation" : "Pin conversation"}
      >
        <svg
          width="18"
          height="18"
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
  );
}
