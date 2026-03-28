import { useEffect } from "react";
import { useChatStore, selectActiveConversation } from "@/stores/chatStore";
import { ChatConversationHeader } from "./ChatConversationHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatMessageInput } from "./ChatMessageInput";
import { ChatEmptyState } from "./ChatEmptyState";
import styles from "./ChatConversation.module.scss";

export function ChatConversation() {
  const activeConversation = useChatStore(selectActiveConversation);
  const setMessageSearchOpen = useChatStore((s) => s.setMessageSearchOpen);

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
