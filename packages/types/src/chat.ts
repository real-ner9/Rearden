export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  isPinned: boolean;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  createdAt: string;
  updatedAt: string;
}

export type ChatTab = "all" | "unread" | "pinned";

// WebSocket events: Client → Server
export type WSClientEvent =
  | { type: "message:send"; conversationId: string; text: string }
  | { type: "typing:start"; conversationId: string }
  | { type: "typing:stop"; conversationId: string }
  | { type: "conversation:read"; conversationId: string };

// WebSocket events: Server → Client
export type WSServerEvent =
  | { type: "message:new"; message: ChatMessage; conversation: ChatConversation }
  | { type: "typing:indicator"; conversationId: string; userName: string; isTyping: boolean }
  | { type: "conversation:updated"; conversation: ChatConversation }
  | { type: "connected"; userId: string }
  | { type: "error"; code: string; message: string };
