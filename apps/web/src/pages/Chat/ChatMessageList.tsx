import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ChatMessage } from "@rearden/types";
import { useShallow } from "zustand/react/shallow";
import { useChatStore, selectActiveMessages } from "@/stores/chatStore";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatDateDivider } from "./ChatDateDivider";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import styles from "./ChatMessageList.module.scss";

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function groupByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[] {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const label = formatDateLabel(msg.createdAt);
    if (label !== currentDate) {
      currentDate = label;
      groups.push({ date: label, messages: [msg] });
    } else {
      groups[groups.length - 1]!.messages.push(msg);
    }
  }

  return groups;
}

export function ChatMessageList() {
  const activeMessages = useChatStore(useShallow(selectActiveMessages));
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const typingIndicators = useChatStore((s) => s.typingIndicators);
  const highlightedMessageId = useChatStore((s) => s.highlightedMessageId);
  const highlightedMessageNonce = useChatStore((s) => s.highlightedMessageNonce);
  const registerScrollToBottom = useChatStore((s) => s.registerScrollToBottom);
  const listRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  const groups = useMemo(() => groupByDate(activeMessages), [activeMessages]);

  const typing = typingIndicators.find(
    (t) => t.conversationId === activeConversationId,
  );

  const doScroll = useCallback((behavior: ScrollBehavior = "instant") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    registerScrollToBottom(doScroll);
  }, [registerScrollToBottom, doScroll]);

  // Scroll to bottom whenever messages change
  useLayoutEffect(() => {
    if (activeMessages.length > 0) {
      doScroll(didInitialScroll.current ? "smooth" : "instant");
      didInitialScroll.current = true;
    }
  }, [activeMessages, doScroll]);

  // Scroll to highlighted search result
  useEffect(() => {
    if (!highlightedMessageId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-message-id="${highlightedMessageId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedMessageId, highlightedMessageNonce]);

  return (
    <div className={styles.list} ref={listRef}>
      {groups.map((group) => (
        <div key={group.date}>
          <ChatDateDivider date={group.date} />
          {group.messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isHighlighted={msg.id === highlightedMessageId}
            />
          ))}
        </div>
      ))}

      <AnimatePresence>
        {typing && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <ChatTypingIndicator name={typing.userName} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
