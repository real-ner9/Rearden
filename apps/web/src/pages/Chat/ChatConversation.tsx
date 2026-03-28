import { useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { ChatConversationHeader } from "./ChatConversationHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatMessageInput } from "./ChatMessageInput";
import { ChatEmptyState } from "./ChatEmptyState";
import styles from "./ChatConversation.module.scss";

export function ChatConversation() {
  const { activeConversation, setMessageSearchOpen } = useChat();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && activeConversation) {
        e.preventDefault();
        setMessageSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activeConversation, setMessageSearchOpen]);

  if (!activeConversation) {
    return (
      <div className={styles.conversation}>
        <ChatEmptyState />
      </div>
    );
  }

  return (
    <div className={styles.conversation}>
      <ChatConversationHeader />
      <ChatMessageList key={activeConversation.id} />
      <ChatMessageInput />
    </div>
  );
}
