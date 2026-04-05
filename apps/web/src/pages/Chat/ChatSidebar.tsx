import { useShallow } from "zustand/react/shallow";
import { useChatStore, selectFilteredConversations, selectActiveConversation } from "@/stores/chatStore";
import { ChatSearch } from "./ChatSearch";
import { ChatTabBar } from "./ChatTabBar";
import { ChatConversationItem } from "./ChatConversationItem";
import { ChatFolderSettings } from "./ChatFolderSettings";
import { ChatMessageSearch } from "./ChatMessageSearch";
import styles from "./ChatSidebar.module.scss";

export function ChatSidebar() {
  const filteredConversations = useChatStore(useShallow(selectFilteredConversations));
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const openConversation = useChatStore((s) => s.openConversation);
  const messageSearchOpen = useChatStore((s) => s.messageSearchOpen);
  const activeConversation = useChatStore(selectActiveConversation);

  if (messageSearchOpen && activeConversation) {
    return (
      <div className={styles.sidebar}>
        <ChatMessageSearch />
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
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
      <ChatFolderSettings />
    </div>
  );
}
