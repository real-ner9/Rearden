import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useChatStore, selectMessageSearchResults, selectActiveConversation } from "@/stores/chatStore";
import styles from "./ChatMessageSearch.module.scss";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatMessageSearch() {
  const messageSearchQuery = useChatStore((s) => s.messageSearchQuery);
  const messageSearchResults = useChatStore(useShallow(selectMessageSearchResults));
  const highlightedMessageId = useChatStore((s) => s.highlightedMessageId);
  const setMessageSearchQuery = useChatStore((s) => s.setMessageSearchQuery);
  const setMessageSearchOpen = useChatStore((s) => s.setMessageSearchOpen);
  const setHighlightedMessageId = useChatStore((s) => s.setHighlightedMessageId);
  const activeConversation = useChatStore(selectActiveConversation);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const senderName = (senderId: string, senderRole: string) => {
    if (senderRole === "recruiter") return "You";
    return activeConversation?.userName ?? senderId;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.searchIcon}
            width="14"
            height="14"
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
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search messages..."
            value={messageSearchQuery}
            onChange={(e) => setMessageSearchQuery(e.target.value)}
          />
        </div>
        <button
          className={styles.closeBtn}
          onClick={() => setMessageSearchOpen(false)}
          title="Close search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {messageSearchQuery.trim() && (
        <div className={styles.counter}>
          {messageSearchResults.length} message{messageSearchResults.length !== 1 ? "s" : ""} found
        </div>
      )}

      <div className={styles.results}>
        {messageSearchResults.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.resultItem} ${highlightedMessageId === msg.id ? styles.resultActive : ""}`}
            onClick={() => setHighlightedMessageId(msg.id)}
          >
            <span className={styles.resultSender}>
              {senderName(msg.senderId, msg.senderRole)}
            </span>
            <span className={styles.resultText}>{msg.text}</span>
            <span className={styles.resultDate}>{formatDate(msg.createdAt)}</span>
          </div>
        ))}
        {messageSearchQuery.trim() && messageSearchResults.length === 0 && (
          <p className={styles.empty}>No messages match your search</p>
        )}
      </div>
    </div>
  );
}
