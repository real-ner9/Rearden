import { useEffect } from "react";
import { useChatStore, selectActiveConversation } from "@/stores/chatStore";
import { ChatConversationHeader } from "./ChatConversationHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatMessageInput } from "./ChatMessageInput";
import { ChatEmptyState } from "./ChatEmptyState";
import { MessageContextMenu } from "./MessageContextMenu";
import styles from "./ChatConversation.module.scss";

export function ChatConversation() {
  const activeConversation = useChatStore(selectActiveConversation);
  const setMessageSearchOpen = useChatStore((s) => s.setMessageSearchOpen);
  const contextMenuMessage = useChatStore((s) => s.contextMenuMessage);
  const contextMenuPosition = useChatStore((s) => s.contextMenuPosition);
  const closeContextMenu = useChatStore((s) => s.closeContextMenu);

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
      {contextMenuMessage && contextMenuPosition && (
        <MessageContextMenu
          message={contextMenuMessage}
          position={contextMenuPosition}
          isMine={contextMenuMessage.senderRole === "recruiter"}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
