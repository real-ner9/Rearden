import { create } from "zustand";
import { useEffect } from "react";
import type {
  ChatConversation,
  ChatFolder,
  ChatMessage,
  ChatTab,
  WSClientEvent,
  WSServerEvent,
} from "@rearden/types";
import { useAuthStore } from "./authStore";
import { apiFetch } from "@/lib/api";

interface TypingIndicator {
  userName: string;
  conversationId: string;
}

interface ChatState {
  conversations: ChatConversation[];
  messagesCache: Map<string, ChatMessage[]>;
  activeConversationId: string | null;
  activeTab: ChatTab;
  searchQuery: string;
  debouncedSearch: string;
  typingIndicators: TypingIndicator[];
  folders: ChatFolder[];
  folderSettingsOpen: boolean;
  messageSearchOpen: boolean;
  messageSearchQuery: string;
  highlightedMessageId: string | null;
  highlightedMessageNonce: number;
  connectionStatus: "connecting" | "connected" | "disconnected";
  replyingTo: ChatMessage | null;
  contextMenuMessage: ChatMessage | null;
  contextMenuPosition: { x: number; y: number } | null;

  // Actions
  setActiveTab: (tab: ChatTab) => void;
  setSearchQuery: (query: string) => void;
  openConversation: (id: string) => void;
  openConversationByUser: (userId: string) => void;
  closeConversation: () => void;
  deleteConversation: (id: string) => void;
  sendMessage: (text: string) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  registerScrollToBottom: (fn: (behavior?: ScrollBehavior) => void) => void;
  startConversation: (userId: string, userName: string) => Promise<string | null>;
  togglePin: (id: string) => void;
  setConnectionStatus: (status: "connecting" | "connected" | "disconnected") => void;
  handleWSMessage: (event: WSServerEvent) => void;
  fetchConversations: () => void;
  fetchFolders: () => void;
  createFolder: (name: string) => Promise<void>;
  updateFolder: (id: string, data: { name?: string; conversationIds?: string[]; order?: number }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  setFolderSettingsOpen: (open: boolean) => void;
  setMessageSearchOpen: (open: boolean) => void;
  setMessageSearchQuery: (query: string) => void;
  setHighlightedMessageId: (id: string | null) => void;
  registerClosePanel: (fn: (() => void) | null) => void;
  requestClosePanel: () => void;
  setSend: (fn: (event: WSClientEvent) => void) => void;
  cleanup: () => void;
  setReplyingTo: (msg: ChatMessage | null) => void;
  openContextMenu: (msg: ChatMessage, position: { x: number; y: number }) => void;
  closeContextMenu: () => void;
  toggleMessageReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
}

// Module-level variables (not in store state - these are refs)
let _scrollToBottomFn: ((behavior?: ScrollBehavior) => void) | null = null;
let _sendWs: ((event: WSClientEvent) => void) | null = null;
let _closePanelFn: (() => void) | null = null;
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
let highlightTimer: ReturnType<typeof setTimeout> | null = null;
let highlightNonceCounter = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeConversationFetchId: string | null = null;

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  messagesCache: new Map(),
  activeConversationId: null,
  activeTab: "all",
  searchQuery: "",
  debouncedSearch: "",
  typingIndicators: [],
  folders: [],
  folderSettingsOpen: false,
  messageSearchOpen: false,
  messageSearchQuery: "",
  highlightedMessageId: null,
  highlightedMessageNonce: 0,
  connectionStatus: "disconnected",
  replyingTo: null,
  contextMenuMessage: null,
  contextMenuPosition: null,

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    // Debounce the search
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      set({ debouncedSearch: query });
    }, 200);
  },

  openConversation: (id) => {
    set({ activeConversationId: id });

    // Fetch messages if not cached
    const { messagesCache } = get();
    if (!messagesCache.has(id)) {
      activeConversationFetchId = id;
      apiFetch<{ success: boolean; data: ChatMessage[] }>(`/chat/${id}/messages`)
        .then((res) => {
          if (res.success && activeConversationFetchId === id) {
            set((state) => {
              const newCache = new Map(state.messagesCache);
              newCache.set(id, res.data);
              return { messagesCache: newCache };
            });
          }
        })
        .catch(() => {});
    }

    // Mark as read
    if (_sendWs) {
      _sendWs({ type: "conversation:read", conversationId: id });
    }
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  openConversationByUser: (userId) => {
    const { conversations, openConversation } = get();
    const conv = conversations.find((c) => c.userId === userId);
    if (conv) {
      openConversation(conv.id);
    }
  },

  closeConversation: () => {
    set({ activeConversationId: null });
  },

  deleteConversation: (id) => {
    const { conversations, messagesCache, activeConversationId, folders } = get();

    // Snapshot for rollback
    const snapshot = { conversations, activeConversationId };

    // Optimistic: remove from conversations, clear messages cache, update folders
    const newCache = new Map(messagesCache);
    newCache.delete(id);

    set({
      conversations: conversations.filter((c) => c.id !== id),
      messagesCache: newCache,
      activeConversationId: activeConversationId === id ? null : activeConversationId,
      folders: folders.map((f) => ({
        ...f,
        conversationIds: f.conversationIds.filter((cid) => cid !== id),
      })),
    });

    apiFetch(`/chat/${id}`, { method: "DELETE" }).catch(() => {
      // Rollback on failure
      get().fetchConversations();
    });
  },

  sendMessage: (text) => {
    const { activeConversationId, replyingTo } = get();
    if (!activeConversationId || !text.trim()) return;

    const user = useAuthStore.getState().user;
    const senderId = user?.id ?? "recruiter-1";
    const senderRole = "recruiter";

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `opt-${Date.now()}`,
      conversationId: activeConversationId,
      senderId,
      senderRole,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      replyToId: replyingTo?.id ?? null,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderId: replyingTo.senderId,
            senderRole: replyingTo.senderRole,
            text: replyingTo.text,
          }
        : null,
      reactions: [],
    };

    set((state) => {
      const newCache = new Map(state.messagesCache);
      const msgs = newCache.get(activeConversationId) ?? [];
      newCache.set(activeConversationId, [...msgs, optimisticMsg]);

      return {
        messagesCache: newCache,
        conversations: state.conversations.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: optimisticMsg, updatedAt: optimisticMsg.createdAt }
            : c
        ),
        replyingTo: null,
      };
    });

    if (_sendWs) {
      _sendWs({
        type: "message:send",
        conversationId: activeConversationId,
        text: text.trim(),
        replyToId: replyingTo?.id,
      });
    }
  },

  scrollToBottom: (behavior) => {
    _scrollToBottomFn?.(behavior);
  },

  registerScrollToBottom: (fn) => {
    _scrollToBottomFn = fn;
  },

  startConversation: async (userId, userName) => {
    const { conversations, openConversation } = get();
    const existing = conversations.find((c) => c.userId === userId);
    if (existing) {
      openConversation(existing.id);
      return existing.id;
    }

    try {
      const res = await apiFetch<{ success: boolean; data: ChatConversation }>("/chat", {
        method: "POST",
        body: JSON.stringify({ userId, userName }),
      });
      if (res.success) {
        set((state) => {
          const newCache = new Map(state.messagesCache);
          newCache.set(res.data.id, []);
          return {
            conversations: [res.data, ...state.conversations],
            messagesCache: newCache,
            activeConversationId: res.data.id,
          };
        });
        return res.data.id;
      }
    } catch {}
    return null;
  },

  togglePin: (id) => {
    const { conversations } = get();
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    const newPinned = !conv.isPinned;
    const newPinnedAt = newPinned ? new Date().toISOString() : null;
    // Optimistic update
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, isPinned: newPinned, pinnedAt: newPinnedAt } : c
      ),
    }));

    apiFetch(`/chat/${id}/pin`, {
      method: "PATCH",
      body: JSON.stringify({ isPinned: newPinned }),
    }).catch(() => {
      // Revert on failure
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, isPinned: !newPinned, pinnedAt: conv.pinnedAt } : c
        ),
      }));
    });
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
    if (status === "disconnected") {
      get().cleanup();
    }
  },

  handleWSMessage: (event) => {
    switch (event.type) {
      case "message:new": {
        const { message, conversation } = event;
        set((state) => {
          const updatedConversations = state.conversations.map((c) =>
            c.id === conversation.id ? conversation : c
          );
          // Sort by updatedAt descending
          updatedConversations.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          return { conversations: updatedConversations };
        });

        set((state) => {
          const newCache = new Map(state.messagesCache);
          const msgs = newCache.get(message.conversationId) ?? [];

          // Replace optimistic message with server-confirmed one
          const optIdx = msgs.findIndex(
            (m) =>
              m.id.startsWith("opt-") &&
              m.senderId === message.senderId &&
              m.text === message.text
          );

          if (optIdx !== -1) {
            const updated = [...msgs];
            updated[optIdx] = message;
            newCache.set(message.conversationId, updated);
          } else if (!msgs.some((m) => m.id === message.id)) {
            // Append only if not already present (dedup by ID)
            newCache.set(message.conversationId, [...msgs, message]);
          }

          return { messagesCache: newCache };
        });
        break;
      }

      case "typing:indicator": {
        const { conversationId, userName, isTyping } = event;
        if (isTyping) {
          set((state) => {
            if (state.typingIndicators.some((t) => t.conversationId === conversationId)) {
              return state;
            }
            return {
              typingIndicators: [...state.typingIndicators, { userName, conversationId }],
            };
          });

          // Auto-clear after 10s
          const existing = typingTimers.get(conversationId);
          if (existing) clearTimeout(existing);
          typingTimers.set(
            conversationId,
            setTimeout(() => {
              set((state) => ({
                typingIndicators: state.typingIndicators.filter(
                  (t) => t.conversationId !== conversationId
                ),
              }));
              typingTimers.delete(conversationId);
            }, 10000)
          );
        } else {
          set((state) => ({
            typingIndicators: state.typingIndicators.filter(
              (t) => t.conversationId !== conversationId
            ),
          }));
          const timer = typingTimers.get(conversationId);
          if (timer) {
            clearTimeout(timer);
            typingTimers.delete(conversationId);
          }
        }
        break;
      }

      case "conversation:updated": {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === event.conversation.id ? event.conversation : c
          ),
        }));
        break;
      }

      case "reaction:updated": {
        const { messageId, reactions } = event;
        set((state) => {
          const newCache = new Map(state.messagesCache);
          for (const [convId, msgs] of newCache) {
            const idx = msgs.findIndex((m) => m.id === messageId);
            if (idx !== -1) {
              const updated = [...msgs];
              updated[idx] = { ...updated[idx]!, reactions };
              newCache.set(convId, updated);
              break;
            }
          }
          return { messagesCache: newCache };
        });
        break;
      }

      case "message:deleted": {
        const { messageId, conversationId } = event;
        set((state) => {
          const newCache = new Map(state.messagesCache);
          const msgs = newCache.get(conversationId);
          if (msgs) {
            // Remove the deleted message
            newCache.set(
              conversationId,
              msgs.filter((m) => m.id !== messageId)
            );
            // Update replyTo references - set to null for messages replying to deleted one
            const updated = newCache.get(conversationId)!.map((m) =>
              m.replyToId === messageId ? { ...m, replyTo: null } : m
            );
            newCache.set(conversationId, updated);
          }
          return { messagesCache: newCache };
        });
        break;
      }

      case "connected":
      case "error":
        break;
    }
  },

  fetchConversations: () => {
    apiFetch<{ success: boolean; data: ChatConversation[] }>("/chat")
      .then((res) => {
        if (res.success) {
          set({ conversations: res.data });
        }
      })
      .catch(() => {});
  },

  fetchFolders: () => {
    apiFetch<{ success: boolean; data: ChatFolder[] }>("/chat/folders")
      .then((res) => {
        if (res.success) {
          set({ folders: res.data });
        }
      })
      .catch(() => {});
  },

  createFolder: async (name) => {
    try {
      const res = await apiFetch<{ success: boolean; data: ChatFolder }>("/chat/folders", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (res.success) {
        set((state) => ({ folders: [...state.folders, res.data] }));
      }
    } catch {}
  },

  updateFolder: async (id, data) => {
    try {
      const res = await apiFetch<{ success: boolean; data: ChatFolder }>(`/chat/folders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (res.success) {
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? res.data : f)),
        }));
      }
    } catch {}
  },

  deleteFolder: async (id) => {
    try {
      const res = await apiFetch<{ success: boolean }>(`/chat/folders/${id}`, { method: "DELETE" });
      if (res.success) {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          activeTab: state.activeTab === id ? "all" : state.activeTab,
        }));
      }
    } catch {}
  },

  setFolderSettingsOpen: (open) => {
    set({ folderSettingsOpen: open });
  },

  setMessageSearchOpen: (open) => {
    set({ messageSearchOpen: open });
    if (!open) {
      set({ messageSearchQuery: "", highlightedMessageId: null });
      if (highlightTimer) {
        clearTimeout(highlightTimer);
        highlightTimer = null;
      }
    }
  },

  setMessageSearchQuery: (query) => {
    set({ messageSearchQuery: query });
  },

  setHighlightedMessageId: (id) => {
    if (highlightTimer) clearTimeout(highlightTimer);
    if (id) {
      highlightNonceCounter += 1;
      const nonce = highlightNonceCounter;
      set({ highlightedMessageId: id, highlightedMessageNonce: nonce });
      highlightTimer = setTimeout(() => {
        const currentNonce = get().highlightedMessageNonce;
        if (currentNonce === nonce) {
          set({ highlightedMessageId: null });
        }
        highlightTimer = null;
      }, 2500);
    } else {
      set({ highlightedMessageId: null });
    }
  },

  registerClosePanel: (fn) => {
    _closePanelFn = fn;
  },

  requestClosePanel: () => {
    if (_closePanelFn) {
      _closePanelFn();
    } else {
      set({ activeConversationId: null });
    }
  },

  setSend: (fn) => {
    _sendWs = fn;
  },

  setReplyingTo: (msg) => {
    set({ replyingTo: msg });
  },

  openContextMenu: (msg, position) => {
    set({ contextMenuMessage: msg, contextMenuPosition: position });
  },

  closeContextMenu: () => {
    set({ contextMenuMessage: null, contextMenuPosition: null });
  },

  toggleMessageReaction: (messageId, emoji) => {
    const { activeConversationId, messagesCache } = get();
    if (!activeConversationId) return;

    // Optimistic update
    set((state) => {
      const newCache = new Map(state.messagesCache);
      for (const [convId, msgs] of newCache) {
        const idx = msgs.findIndex((m) => m.id === messageId);
        if (idx !== -1) {
          const msg = msgs[idx]!;
          const reactions = [...(msg.reactions ?? [])];
          const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

          if (existingIdx !== -1) {
            // User already reacted - toggle off
            const existing = reactions[existingIdx]!;
            if (existing.reacted) {
              if (existing.count <= 1) {
                reactions.splice(existingIdx, 1);
              } else {
                reactions[existingIdx] = { ...existing, count: existing.count - 1, reacted: false };
              }
            } else {
              reactions[existingIdx] = { ...existing, count: existing.count + 1, reacted: true };
            }
          } else {
            // New reaction
            reactions.push({ emoji, count: 1, reacted: true });
          }

          const updated = [...msgs];
          updated[idx] = { ...msg, reactions };
          newCache.set(convId, updated);
          break;
        }
      }
      return { messagesCache: newCache };
    });

    // Send WS event
    if (_sendWs) {
      _sendWs({ type: "reaction:toggle", messageId, emoji });
    }
  },

  deleteMessage: (messageId) => {
    const { activeConversationId, messagesCache } = get();
    if (!activeConversationId) return;

    // Snapshot for rollback
    const prevMsgs = messagesCache.get(activeConversationId);

    // Optimistic update
    set((state) => {
      const newCache = new Map(state.messagesCache);
      const msgs = newCache.get(activeConversationId);
      if (msgs) {
        newCache.set(
          activeConversationId,
          msgs.filter((m) => m.id !== messageId)
        );
      }
      return { messagesCache: newCache };
    });

    // Use REST API with rollback on failure
    apiFetch(`/chat/${activeConversationId}/messages/${messageId}`, { method: "DELETE" }).catch(() => {
      // Rollback on failure
      if (prevMsgs) {
        set((state) => {
          const newCache = new Map(state.messagesCache);
          newCache.set(activeConversationId, prevMsgs);
          return { messagesCache: newCache };
        });
      }
    });
  },

  cleanup: () => {
    for (const timer of typingTimers.values()) {
      clearTimeout(timer);
    }
    typingTimers.clear();
    if (highlightTimer) {
      clearTimeout(highlightTimer);
      highlightTimer = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  },
}));

// Stable empty arrays to avoid creating new references
const EMPTY_MESSAGES: ChatMessage[] = [];
const EMPTY_CONVERSATIONS: ChatConversation[] = [];

// Exported selectors
export const selectActiveConversation = (s: ChatState) =>
  s.conversations.find((c) => c.id === s.activeConversationId) ?? null;

export const selectActiveMessages = (s: ChatState) =>
  s.activeConversationId ? s.messagesCache.get(s.activeConversationId) ?? EMPTY_MESSAGES : EMPTY_MESSAGES;

export const selectFilteredConversations = (s: ChatState) => {
  let result = [...s.conversations];

  // Filter by tab
  if (s.activeTab === "unread") {
    result = result.filter((c) => c.unreadCount > 0);
  } else if (s.activeTab !== "all") {
    const folder = s.folders.find((f) => f.id === s.activeTab);
    if (folder) {
      result = result.filter((c) => folder.conversationIds.includes(c.id));
    }
  }

  // Filter by search
  if (s.debouncedSearch.trim()) {
    const q = s.debouncedSearch.toLowerCase();
    result = result.filter(
      (c) =>
        c.userName.toLowerCase().includes(q) ||
        c.lastMessage?.text.toLowerCase().includes(q)
    );
  }

  // Sort: pinned first (by pinnedAt DESC — last pinned on top), then unpinned by updatedAt DESC
  result.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.isPinned && b.isPinned) {
      const aPin = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bPin = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      return bPin - aPin;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return result;
};

export const selectMessageSearchResults = (s: ChatState) => {
  if (!s.messageSearchQuery.trim() || !s.activeConversationId) return EMPTY_MESSAGES;
  const q = s.messageSearchQuery.toLowerCase();
  const activeMessages = selectActiveMessages(s);
  return activeMessages
    .filter((m) => m.text.toLowerCase().includes(q))
    .reverse(); // newest first
};

/**
 * Hook to initialize chat state on mount
 * Call this once from an initializer component
 */
export function useChatInit() {
  const user = useAuthStore((s) => s.user);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const fetchFolders = useChatStore((s) => s.fetchFolders);
  const cleanup = useChatStore((s) => s.cleanup);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchFolders();
    }
  }, [user, fetchConversations, fetchFolders]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
}
