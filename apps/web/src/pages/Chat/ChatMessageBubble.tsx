import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { ArrowBendUpLeft } from "@phosphor-icons/react";
import type { ChatMessage } from "@rearden/types";
import { useChatStore } from "@/stores/chatStore";
import styles from "./ChatMessageBubble.module.scss";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isHighlighted?: boolean;
  conversationUserName?: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessageBubble({ message, isHighlighted, conversationUserName }: ChatMessageBubbleProps) {
  const isMine = message.senderRole === "recruiter";
  const [showHeart, setShowHeart] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const swipeX = useMotionValue(0);

  // Derive reply icon opacity from swipe position (swipe left = negative x)
  const replyIconOpacity = useTransform(swipeX, [0, -20, -60], [0, 0.4, 1]);
  const replyIconScale = useTransform(swipeX, [0, -40, -60], [0.5, 0.8, 1]);

  const setReplyingTo = useChatStore((s) => s.setReplyingTo);
  const openContextMenu = useChatStore((s) => s.openContextMenu);
  const toggleMessageReaction = useChatStore((s) => s.toggleMessageReaction);
  const setHighlightedMessageId = useChatStore((s) => s.setHighlightedMessageId);

  const handleTap = useCallback(() => {
    if (isDraggingRef.current) return;
    tapCountRef.current += 1;

    if (tapCountRef.current === 2) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      // Double tap - heart + persist reaction
      setShowHeart(true);
      toggleMessageReaction(message.id, "❤️");
      if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
      heartTimerRef.current = setTimeout(() => {
        setShowHeart(false);
        heartTimerRef.current = null;
      }, 1000);
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
        tapTimerRef.current = null;
      }, 300);
    }
  }, [message.id, toggleMessageReaction]);

  const doOpenContextMenu = useCallback(() => {
    const el = messageRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      openContextMenu(message, { x: rect.left, y: rect.top });
    }
  }, [message, openContextMenu]);

  // Long-press via touch events (more reliable than pointer events for mobile)
  const handleTouchStart = useCallback(() => {
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      doOpenContextMenu();
    }, 500);
  }, [doOpenContextMenu]);

  const handleTouchEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long-press on any move (scroll or drag)
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  // Desktop: right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    doOpenContextMenu();
  }, [doOpenContextMenu]);

  // Desktop: mouse-based long-press
  const handleMouseDown = useCallback(() => {
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      doOpenContextMenu();
    }, 500);
  }, [doOpenContextMenu]);

  const handleMouseUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handleReplyClick = useCallback(() => {
    setReplyingTo(message);
  }, [message, setReplyingTo]);

  const handleReplyPreviewClick = useCallback(() => {
    if (message.replyTo) {
      setHighlightedMessageId(message.replyTo.id);
    }
  }, [message.replyTo, setHighlightedMessageId]);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    // Cancel long-press on drag
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number } }) => {
    // Swipe left: offset.x will be negative
    if (info.offset.x < -60) {
      setReplyingTo(message);
    }
    animate(swipeX, 0, { type: "spring", stiffness: 400, damping: 30 });
    setTimeout(() => { isDraggingRef.current = false; }, 50);
  }, [message, setReplyingTo, swipeX]);

  const handleReactionClick = useCallback((emoji: string) => {
    toggleMessageReaction(message.id, emoji);
  }, [message.id, toggleMessageReaction]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    };
  }, []);

  const replyToSenderName = message.replyTo
    ? message.replyTo.senderRole === "recruiter" ? "You" : (conversationUserName ?? "User")
    : null;

  const reactions = message.reactions ?? [];

  return (
    <div
      className={`${styles.message} ${isMine ? styles.mine : styles.theirs} ${isHighlighted ? styles.highlighted : ""}`}
      data-message-id={message.id}
      ref={messageRef}
    >
      {/* Swipe reply icon — positioned on the right, revealed during left-swipe */}
      <motion.div
        className={styles.swipeReplyBg}
        style={{ opacity: replyIconOpacity, scale: replyIconScale }}
      >
        <ArrowBendUpLeft size={20} weight="bold" />
      </motion.div>

      <motion.div
        className={styles.swipeForeground}
        style={{ x: swipeX }}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Desktop hover reply button */}
        <button
          className={styles.replyButton}
          onClick={handleReplyClick}
          aria-label="Reply"
        >
          <ArrowBendUpLeft size={16} weight="bold" />
        </button>

        <div
          className={styles.bubble}
          ref={bubbleRef}
          onClick={handleTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
        >
          {/* Reply preview inside bubble */}
          {message.replyTo && (
            <div className={styles.replyPreview} onClick={handleReplyPreviewClick}>
              <span className={styles.replyName}>{replyToSenderName}</span>
              <span className={styles.replyText}>{message.replyTo.text.slice(0, 100)}</span>
            </div>
          )}
          {message.replyToId && !message.replyTo && (
            <div className={styles.replyPreview}>
              <span className={styles.replyDeleted}>Deleted message</span>
            </div>
          )}

          <p className={styles.text}>{message.text}</p>
          <span className={styles.time}>{formatTime(message.createdAt)}</span>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className={styles.reactions}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                className={`${styles.reactionChip} ${r.reacted ? styles.reacted : ""}`}
                onClick={() => handleReactionClick(r.emoji)}
              >
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showHeart && (
          <motion.div
            className={styles.heartOverlay}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            ❤️
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
