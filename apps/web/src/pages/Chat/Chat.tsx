import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useChat } from "@/contexts/ChatContext";
import { ChatSidebar } from "./ChatSidebar";
import { ChatConversation } from "./ChatConversation";
import styles from "./Chat.module.scss";

export function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { activeConversationId, openConversation } = useChat();

  // Open conversation from URL param
  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      openConversation(conversationId);
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.chat}>
      {/* Desktop: both panels */}
      <div className={styles.sidebarDesktop}>
        <ChatSidebar />
      </div>
      <div className={styles.conversationDesktop}>
        <ChatConversation />
      </div>

      {/* Mobile: single panel with transition */}
      <div className={styles.mobileContainer}>
        <AnimatePresence mode="wait">
          {activeConversationId ? (
            <motion.div
              key="conv"
              className={styles.mobilePanel}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              <ChatConversation />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className={styles.mobilePanel}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              <ChatSidebar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
