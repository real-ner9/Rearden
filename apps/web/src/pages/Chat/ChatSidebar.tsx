import { useChat } from "@/contexts/ChatContext";
import { ChatSearch } from "./ChatSearch";
import { ChatTabBar } from "./ChatTabBar";
import { ChatConversationItem } from "./ChatConversationItem";
import styles from "./ChatSidebar.module.scss";

export function ChatSidebar() {
  const { filteredConversations, activeConversationId, openConversation } = useChat();

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Messages</h2>
      </div>
      <ChatSearch />
      <ChatTabBar />
      <div className={styles.list}>
        {filteredConversations.map((conv) => (
          <ChatConversationItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === activeConversationId}
            onSelect={openConversation}
          />
        ))}
        {filteredConversations.length === 0 && (
          <p className={styles.empty}>No conversations found</p>
        )}
      </div>
    </div>
  );
}
