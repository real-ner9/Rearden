import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowBendUpLeft, Copy, PushPin, ShareFat, Trash, CheckCircle } from "@phosphor-icons/react";
import type { ChatMessage } from "@rearden/types";
import { useChatStore } from "@/stores/chatStore";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import styles from "./MessageContextMenu.module.scss";

const PRESET_EMOJIS = ["\u2764\uFE0F", "\uD83D\uDC4C", "\uD83D\uDCAF", "\uD83D\uDC40", "\uD83C\uDFC6", "\uD83E\uDD1D", "\uD83D\uDE02"];

interface Props {
  message: ChatMessage;
  position: { x: number; y: number };
  isMine: boolean;
  onClose: () => void;
}

export function MessageContextMenu({ message, position, isMine, onClose }: Props) {
  const setReplyingTo = useChatStore((s) => s.setReplyingTo);
  const toggleMessageReaction = useChatStore((s) => s.toggleMessageReaction);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, showDeleteConfirm]);

  const handleReply = useCallback(() => {
    setReplyingTo(message);
    onClose();
  }, [message, setReplyingTo, onClose]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.text);
    onClose();
  }, [message.text, onClose]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    deleteMessage(message.id);
    setShowDeleteConfirm(false);
    onClose();
  }, [message.id, deleteMessage, onClose]);

  const handleReaction = useCallback((emoji: string) => {
    toggleMessageReaction(message.id, emoji);
    onClose();
  }, [message.id, toggleMessageReaction, onClose]);

  const showComingSoon = useCallback((label: string) => {
    setToast(`${label}: coming soon`);
    setTimeout(() => {
      setToast(null);
      onClose();
    }, 1200);
  }, [onClose]);

  // Position: place card near the message, clamped to viewport
  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;
  const cardWidth = 240;
  const cardHeight = isMine ? 310 : 270; // estimate

  // Horizontal: try to center on position.x, clamp to viewport
  let left = Math.max(12, Math.min(position.x - cardWidth / 2, viewportW - cardWidth - 12));

  // Vertical: prefer above the message, fall back to below
  let top: number;
  if (position.y - cardHeight - 8 > 8) {
    top = position.y - cardHeight - 8;
  } else {
    top = Math.min(position.y + 8, viewportH - cardHeight - 8);
  }

  return createPortal(
    <>
      <AnimatePresence>
        {!showDeleteConfirm && (
          <div className={styles.overlay} onClick={onClose}>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            />

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  className={styles.toast}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Single card: emojis + actions */}
            <motion.div
              className={styles.card}
              ref={cardRef}
              style={{ top, left, width: cardWidth }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Emoji row */}
              <div className={styles.emojiRow}>
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className={styles.emojiButton}
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Action items */}
              <div className={styles.menuItems}>
                <button className={styles.menuItem} onClick={handleReply}>
                  <ArrowBendUpLeft size={18} weight="bold" />
                  <span>Reply</span>
                </button>
                <button className={styles.menuItem} onClick={handleCopy}>
                  <Copy size={18} weight="bold" />
                  <span>Copy</span>
                </button>
                <button className={styles.menuItem} onClick={() => showComingSoon("Pin")}>
                  <PushPin size={18} weight="bold" />
                  <span>Pin</span>
                  <span className={styles.comingSoon}>Soon</span>
                </button>
                <button className={styles.menuItem} onClick={() => showComingSoon("Forward")}>
                  <ShareFat size={18} weight="bold" />
                  <span>Forward</span>
                  <span className={styles.comingSoon}>Soon</span>
                </button>
                {isMine && (
                  <>
                    <div className={styles.separator} />
                    <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleDeleteClick}>
                      <Trash size={18} weight="bold" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete message"
          message="Are you sure you want to delete this message? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>,
    document.body
  );
}
