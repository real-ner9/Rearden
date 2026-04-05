import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import type { ChatConversation } from "@rearden/types";
import { useChatStore } from "@/stores/chatStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import styles from "./ChatConversationItem.module.scss";

interface ChatConversationItemProps {
  conversation: ChatConversation;
  isActive: boolean;
  onSelect: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (days === 1) return "yesterday";
  if (days < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "numeric", day: "numeric", year: "2-digit" });
}

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M16 3a1 1 0 0 1 .117 1.993L16 5H14.28l-.719 4.32A4.003 4.003 0 0 1 16.5 13c0 .614-.138 1.196-.386 1.717l-.156.283H14v6a1 1 0 0 1-1.993.117L12 21v-6H8.042l-.156-.283A3.97 3.97 0 0 1 7.5 13a4.003 4.003 0 0 1 2.94-3.858L9.72 5H8a1 1 0 0 1-.117-1.993L8 3h8z" />
  </svg>
);

export function ChatConversationItem({
  conversation,
  isActive,
  onSelect,
}: ChatConversationItemProps) {
  const togglePin = useChatStore((s) => s.togglePin);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showConfirm, setShowConfirm] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  const resetSwipe = useCallback(() => {
    setSwiped(false);
    animate(x, 0, { type: "tween", duration: 0.2 });
  }, [x]);

  const handlePin = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    togglePin(conversation.id);
    resetSwipe();
  }, [togglePin, conversation.id, resetSwipe]);

  const handleDelete = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    deleteConversation(conversation.id);
    setShowConfirm(false);
    resetSwipe();
  }, [deleteConversation, conversation.id, resetSwipe]);

  const handleClick = useCallback(() => {
    if (isDragging.current) return;
    if (swiped) {
      resetSwipe();
      return;
    }
    onSelect(conversation.id);
  }, [swiped, onSelect, conversation.id, resetSwipe]);

  // Build sender prefix for preview
  const lastMsg = conversation.lastMessage;
  let previewPrefix = "";
  let previewText = "";
  if (lastMsg) {
    if (lastMsg.senderRole === "recruiter") {
      previewPrefix = "You: ";
    } else {
      previewPrefix = `${conversation.userName}: `;
    }
    previewText = lastMsg.text;
  }

  // Bottom-right indicator: unread badge takes priority, then pin icon
  const hasUnread = conversation.unreadCount > 0;

  // Foreground content — Telegram-style layout:
  // Row 1: [Name]                    [Date]
  // Row 2: [Prefix: preview text...] [Pin|Badge]
  const itemContent = (
    <>
      <div className={styles.avatar}>
        {conversation.userName.charAt(0)}
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={styles.name}>{conversation.userName}</span>
          {lastMsg && (
            <span className={styles.time}>{formatDate(lastMsg.createdAt)}</span>
          )}
        </div>
        <div className={styles.bottomRow}>
          {lastMsg ? (
            <p className={styles.preview}>
              <span className={styles.previewPrefix}>{previewPrefix}</span>
              {previewText}
            </p>
          ) : (
            <p className={styles.preview} />
          )}
          <div className={styles.bottomRight}>
            {hasUnread ? (
              <span className={styles.unreadBadge}>{conversation.unreadCount}</span>
            ) : conversation.isPinned ? (
              <span className={styles.pinIcon}><PinIcon /></span>
            ) : null}
            {!isMobile && (
              <button
                className={`${styles.pinButton} ${conversation.isPinned ? styles.isPinnedBtn : ""}`}
                onClick={handlePin}
                title={conversation.isPinned ? "Unpin" : "Pin"}
              >
                <PinIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className={styles.swipeWrapper}>
          <div className={styles.swipeActions}>
            <button className={styles.swipeActionPin} onClick={handlePin}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
            </button>
            <button className={styles.swipeActionDelete} onClick={handleDelete}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>

          <motion.div
            role="button"
            tabIndex={0}
            className={`${styles.item} ${isActive ? styles.active : ""} ${styles.foreground}`}
            style={{ x }}
            drag="x"
            dragConstraints={{ left: -144, right: 0 }}
            dragElastic={{ left: 0.1, right: 0 }}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={(_, info) => {
              setTimeout(() => { isDragging.current = false; }, 0);
              if (info.offset.x < -72) {
                setSwiped(true);
                animate(x, -144, { type: "tween", duration: 0.2 });
              } else {
                resetSwipe();
              }
            }}
            onClick={handleClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(conversation.id); }}
          >
            {itemContent}
          </motion.div>
        </div>

        {showConfirm && (
          <ConfirmDialog
            title="Delete conversation"
            message={`Delete your conversation with ${conversation.userName}? This cannot be undone.`}
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={`${styles.item} ${isActive ? styles.active : ""}`}
        onClick={() => onSelect(conversation.id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(conversation.id); }}
      >
        {itemContent}
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete conversation"
          message={`Delete your conversation with ${conversation.userName}? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
