import { useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import type { ChatMessage as ChatMessageType } from "@rearden/types";
import { useChatStore, selectFilteredConversations, selectActiveConversation, selectActiveMessages } from "@/stores/chatStore";
import { ConversationList } from "@/components/ConversationList/ConversationList";
import { ChatMessage } from "@/components/ChatMessage/ChatMessage";
import { ChatInput } from "@/components/ChatInput/ChatInput";
import styles from "./ChatPanel.module.scss";

/** Extracted so useLayoutEffect fires on mount (after AnimatePresence exit completes) */
function PanelMessages({ messages, onSend }: { messages: ChatMessageType[]; onSend: (text: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <div className={styles.messages} ref={containerRef}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
      <ChatInput onSend={onSend} />
    </>
  );
}

export function ChatPanel() {
  const filteredConversations = useChatStore(useShallow(selectFilteredConversations));
  const activeConversation = useChatStore(selectActiveConversation);
  const activeMessages = useChatStore(useShallow(selectActiveMessages));
  const openConversation = useChatStore((s) => s.openConversation);
  const closeConversation = useChatStore((s) => s.closeConversation);
  const sendMessage = useChatStore((s) => s.sendMessage);

  return (
    <div className={styles.panel}>
      <AnimatePresence mode="wait">
        {activeConversation ? (
          <motion.div
            key="conversation"
            className={styles.conversation}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className={styles.convHeader}>
              <button className={styles.backButton} onClick={closeConversation}>
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
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className={styles.convName}>
                {activeConversation.userName}
              </span>
            </div>

            <PanelMessages messages={activeMessages} onSend={sendMessage} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            className={styles.listView}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <ConversationList
              conversations={filteredConversations}
              onSelect={openConversation}
            />
            {filteredConversations.length === 0 && (
              <p className={styles.empty}>No conversations yet</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
