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
  ChatFolder,
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
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  registerScrollToBottom: (fn: (behavior?: ScrollBehavior) => void) => void;
  startConversation: (userId: string, userName: string) => Promise<string | null>;
  togglePin: (id: string) => void;
  folders: ChatFolder[];
  folderSettingsOpen: boolean;
  setFolderSettingsOpen: (open: boolean) => void;
  createFolder: (name: string) => Promise<void>;
  updateFolder: (id: string, data: { name?: string; conversationIds?: string[]; order?: number }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  messageSearchOpen: boolean;
  messageSearchQuery: string;
  messageSearchResults: ChatMessage[];
  highlightedMessageId: string | null;
  highlightedMessageNonce: number;
  setMessageSearchOpen: (open: boolean) => void;
  setMessageSearchQuery: (query: string) => void;
  setHighlightedMessageId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messagesCache, setMessagesCache] = useState<Map<string, ChatMessage[]>>(new Map());
  const messagesCacheRef = useRef<Map<string, ChatMessage[]>>(new Map());
  messagesCacheRef.current = messagesCache;
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ChatTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const conversationsRef = useRef<ChatConversation[]>([]);
  conversationsRef.current = conversations;
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [folderSettingsOpen, setFolderSettingsOpen] = useState(false);
  const [messageSearchOpen, setMessageSearchOpenRaw] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const scrollToBottomRef = useRef<((behavior?: ScrollBehavior) => void) | null>(null);

  const scrollToBottom = useCallback((behavior?: ScrollBehavior) => {
    scrollToBottomRef.current?.(behavior);
  }, []);

  const registerScrollToBottom = useCallback((fn: (behavior?: ScrollBehavior) => void) => {
    scrollToBottomRef.current = fn;
  }, []);
  const [highlightState, setHighlightState] = useState<{ id: string; nonce: number } | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightNonce = useRef(0);

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

          // Replace optimistic message with server-confirmed one
          const optIdx = msgs.findIndex(
            (m) =>
              m.id.startsWith("opt-") &&
              m.senderId === message.senderId &&
              m.text === message.text,
          );

          if (optIdx !== -1) {
            const updated = [...msgs];
            updated[optIdx] = message;
            next.set(message.conversationId, updated);
          } else if (!msgs.some((m) => m.id === message.id)) {
            // Append only if not already present (dedup by ID)
            next.set(message.conversationId, [...msgs, message]);
          }

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

  useEffect(() => {
    fetch("/api/chat/folders")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setFolders(res.data);
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

      // Fetch messages if not cached (use ref to avoid dep on messagesCache)
      if (!messagesCacheRef.current.has(id)) {
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
    [send],
  );

  const openConversationByUser = useCallback(
    (userId: string) => {
      const conv = conversationsRef.current.find((c) => c.userId === userId);
      if (conv) openConversation(conv.id);
    },
    [openConversation],
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
    async (userId: string, userName: string): Promise<string | null> => {
      const existing = conversationsRef.current.find((c) => c.userId === userId);
      if (existing) {
        openConversation(existing.id);
        return existing.id;
      }

      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userName }),
        });
        const res = await r.json();
        if (res.success) {
          setConversations((prev) => [res.data, ...prev]);
          setMessagesCache((prev) => new Map(prev).set(res.data.id, []));
          setActiveConversationId(res.data.id);
          return res.data.id;
        }
      } catch {}
      return null;
    },
    [openConversation],
  );

  const togglePinFn = useCallback((id: string) => {
    const conv = conversationsRef.current.find((c) => c.id === id);
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
  }, []);

  const createFolderFn = useCallback(async (name: string) => {
    try {
      const r = await fetch("/api/chat/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const res = await r.json();
      if (res.success) setFolders((prev) => [...prev, res.data]);
    } catch {}
  }, []);

  const updateFolderFn = useCallback(
    async (id: string, data: { name?: string; conversationIds?: string[]; order?: number }) => {
      try {
        const r = await fetch(`/api/chat/folders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const res = await r.json();
        if (res.success) {
          setFolders((prev) => prev.map((f) => (f.id === id ? res.data : f)));
        }
      } catch {}
    },
    [],
  );

  const deleteFolderFn = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/chat/folders/${id}`, { method: "DELETE" });
      const res = await r.json();
      if (res.success) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        setActiveTab((current) => (current === id ? "all" : current));
      }
    } catch {}
  }, []);

  const highlightedMessageId = highlightState?.id ?? null;

  const setMessageSearchOpen = useCallback((open: boolean) => {
    setMessageSearchOpenRaw(open);
    if (!open) {
      setMessageSearchQuery("");
      setHighlightState(null);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    }
  }, []);

  const setHighlightedMessageId = useCallback((id: string | null) => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    if (id) {
      highlightNonce.current += 1;
      const nonce = highlightNonce.current;
      setHighlightState({ id, nonce });
      highlightTimer.current = setTimeout(() => {
        setHighlightState((prev) => (prev?.nonce === nonce ? null : prev));
        highlightTimer.current = null;
      }, 2500);
    } else {
      setHighlightState(null);
    }
  }, []);

  const messageSearchResults = useMemo(() => {
    if (!messageSearchQuery.trim() || !activeConversationId) return [];
    const q = messageSearchQuery.toLowerCase();
    return activeMessages
      .filter((m) => m.text.toLowerCase().includes(q))
      .reverse(); // newest first
  }, [messageSearchQuery, activeMessages, activeConversationId]);

  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Filter by tab
    if (activeTab === "unread") {
      result = result.filter((c) => c.unreadCount > 0);
    } else if (activeTab !== "all") {
      const folder = folders.find((f) => f.id === activeTab);
      if (folder) {
        result = result.filter((c) => folder.conversationIds.includes(c.id));
      }
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
  }, [conversations, activeTab, searchQuery, folders]);

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
        scrollToBottom,
        registerScrollToBottom,
        startConversation,
        togglePin: togglePinFn,
        folders,
        folderSettingsOpen,
        setFolderSettingsOpen,
        createFolder: createFolderFn,
        updateFolder: updateFolderFn,
        deleteFolder: deleteFolderFn,
        messageSearchOpen,
        messageSearchQuery,
        messageSearchResults,
        highlightedMessageId,
        highlightedMessageNonce: highlightState?.nonce ?? 0,
        setMessageSearchOpen,
        setMessageSearchQuery,
        setHighlightedMessageId,
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
