import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChat } from "@/contexts/ChatContext";
import { ConversationList } from "@/components/ConversationList/ConversationList";
import { ChatMessage } from "@/components/ChatMessage/ChatMessage";
import { ChatInput } from "@/components/ChatInput/ChatInput";
import styles from "./ChatPanel.module.scss";

export function ChatPanel() {
  const {
    filteredConversations,
    activeConversation,
    activeMessages,
    openConversation,
    closeConversation,
    sendMessage,
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

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
                {activeConversation.candidateName}
              </span>
            </div>

            <div className={styles.messages}>
              {activeMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput onSend={sendMessage} />
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
