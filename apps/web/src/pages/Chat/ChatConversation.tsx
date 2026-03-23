import { useChat } from "@/contexts/ChatContext";
import { ChatConversationHeader } from "./ChatConversationHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatMessageInput } from "./ChatMessageInput";
import { ChatEmptyState } from "./ChatEmptyState";
import styles from "./ChatConversation.module.scss";

export function ChatConversation() {
  const { activeConversation } = useChat();

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
      <ChatMessageList />
      <ChatMessageInput />
    </div>
  );
}
