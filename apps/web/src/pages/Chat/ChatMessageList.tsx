import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ChatMessage } from "@rearden/types";
import { useChat } from "@/contexts/ChatContext";
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
  const { activeMessages, activeConversationId, typingIndicators } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => groupByDate(activeMessages), [activeMessages]);

  const typing = typingIndicators.find(
    (t) => t.conversationId === activeConversationId,
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, typing]);

  return (
    <div className={styles.list}>
      {groups.map((group) => (
        <div key={group.date}>
          <ChatDateDivider date={group.date} />
          {group.messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatMessageBubble message={msg} />
            </motion.div>
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
            <ChatTypingIndicator name={typing.candidateName} />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}
