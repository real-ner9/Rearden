import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ChatConversation,
  ChatMessage,
  ChatTab,
  WSServerEvent,
} from "@rearden/types";
import { useWebSocket } from "@/hooks/useWebSocket";

interface TypingIndicator {
  userName: string;
  conversationId: string;
}

interface ChatContextValue {
  conversations: ChatConversation[];
  filteredConversations: ChatConversation[];
  activeConversationId: string | null;
  activeConversation: ChatConversation | null;
  activeMessages: ChatMessage[];
  activeTab: ChatTab;
  searchQuery: string;
  typingIndicators: TypingIndicator[];
  connectionStatus: "connecting" | "connected" | "disconnected";
  setActiveTab: (tab: ChatTab) => void;
  setSearchQuery: (query: string) => void;
  openConversation: (id: string) => void;
  openConversationByUser: (userId: string) => void;
  closeConversation: () => void;
  sendMessage: (text: string) => void;
  startConversation: (userId: string, userName: string) => void;
  togglePin: (id: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messagesCache, setMessagesCache] = useState<Map<string, ChatMessage[]>>(new Map());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ChatTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleWSMessage = useCallback((event: WSServerEvent) => {
    switch (event.type) {
      case "message:new": {
        const { message, conversation } = event;
        setConversations((prev) =>
          prev.map((c) => (c.id === conversation.id ? conversation : c)),
        );
        setMessagesCache((prev) => {
          const next = new Map(prev);
          const msgs = next.get(message.conversationId) ?? [];
          next.set(message.conversationId, [...msgs, message]);
          return next;
        });
        break;
      }

      case "typing:indicator": {
        const { conversationId, userName, isTyping } = event;
        if (isTyping) {
          setTypingIndicators((prev) => {
            if (prev.some((t) => t.conversationId === conversationId)) return prev;
            return [...prev, { userName, conversationId }];
          });
          // Auto-clear after 10s
          const existing = typingTimers.current.get(conversationId);
          if (existing) clearTimeout(existing);
          typingTimers.current.set(
            conversationId,
            setTimeout(() => {
              setTypingIndicators((prev) =>
                prev.filter((t) => t.conversationId !== conversationId),
              );
              typingTimers.current.delete(conversationId);
            }, 10000),
          );
        } else {
          setTypingIndicators((prev) =>
            prev.filter((t) => t.conversationId !== conversationId),
          );
          const timer = typingTimers.current.get(conversationId);
          if (timer) {
            clearTimeout(timer);
            typingTimers.current.delete(conversationId);
          }
        }
        break;
      }

      case "conversation:updated": {
        setConversations((prev) =>
          prev.map((c) => (c.id === event.conversation.id ? event.conversation : c)),
        );
        break;
      }

      case "connected":
      case "error":
        break;
    }
  }, []);

  const { send, status: connectionStatus } = useWebSocket({
    onMessage: handleWSMessage,
  });

  // Fetch conversations on mount
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setConversations(res.data);
      })
      .catch(() => {});
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  const activeMessages = useMemo(
    () => (activeConversationId ? messagesCache.get(activeConversationId) ?? [] : []),
    [activeConversationId, messagesCache],
  );

  // Load messages when opening a conversation
  const openConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);

      // Fetch messages if not cached
      if (!messagesCache.has(id)) {
        fetch(`/api/chat/${id}/messages`)
          .then((r) => r.json())
          .then((res) => {
            if (res.success) {
              setMessagesCache((prev) => new Map(prev).set(id, res.data));
            }
          })
          .catch(() => {});
      }

      // Mark as read
      send({ type: "conversation:read", conversationId: id });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
      );
    },
    [messagesCache, send],
  );

  const openConversationByUser = useCallback(
    (userId: string) => {
      const conv = conversations.find((c) => c.userId === userId);
      if (conv) openConversation(conv.id);
    },
    [conversations, openConversation],
  );

  const closeConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!activeConversationId || !text.trim()) return;

      // Optimistic update
      const optimisticMsg: ChatMessage = {
        id: `opt-${Date.now()}`,
        conversationId: activeConversationId,
        senderId: "recruiter-1",
        senderRole: "recruiter",
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessagesCache((prev) => {
        const next = new Map(prev);
        const msgs = next.get(activeConversationId) ?? [];
        next.set(activeConversationId, [...msgs, optimisticMsg]);
        return next;
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: optimisticMsg, updatedAt: optimisticMsg.createdAt }
            : c,
        ),
      );

      send({ type: "message:send", conversationId: activeConversationId, text: text.trim() });
    },
    [activeConversationId, send],
  );

  const startConversation = useCallback(
    (userId: string, userName: string) => {
      const existing = conversations.find((c) => c.userId === userId);
      if (existing) {
        openConversation(existing.id);
        return;
      }

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setConversations((prev) => [res.data, ...prev]);
            setMessagesCache((prev) => new Map(prev).set(res.data.id, []));
            setActiveConversationId(res.data.id);
          }
        })
        .catch(() => {});
    },
    [conversations, openConversation],
  );

  const togglePinFn = useCallback(
    (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (!conv) return;

      const newPinned = !conv.isPinned;
      // Optimistic
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned: newPinned } : c)),
      );

      fetch(`/api/chat/${id}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: newPinned }),
      }).catch(() => {
        // Revert
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isPinned: !newPinned } : c)),
        );
      });
    },
    [conversations],
  );

  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Filter by tab
    if (activeTab === "unread") {
      result = result.filter((c) => c.unreadCount > 0);
    } else if (activeTab === "pinned") {
      result = result.filter((c) => c.isPinned);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.userName.toLowerCase().includes(q) ||
          c.lastMessage?.text.toLowerCase().includes(q),
      );
    }

    // Sort: pinned first, then by updatedAt
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [conversations, activeTab, searchQuery]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        filteredConversations,
        activeConversationId,
        activeConversation,
        activeMessages,
        activeTab,
        searchQuery,
        typingIndicators,
        connectionStatus,
        setActiveTab,
        setSearchQuery,
        openConversation,
        openConversationByUser,
        closeConversation,
        sendMessage,
        startConversation,
        togglePin: togglePinFn,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
