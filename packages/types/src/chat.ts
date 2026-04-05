export interface ReplyPreview {
  id: string;
  senderId: string;
  senderRole: string;
  text: string;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  text: string;
  replyToId: string | null;
  replyTo: ReplyPreview | null;
  reactions: ReactionCount[];
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  createdAt: string;
  updatedAt: string;
}

export type ChatTab = "all" | "unread" | string;

export interface ChatFolder {
  id: string;
  name: string;
  order: number;
  conversationIds: string[];
}

// WebSocket events: Client → Server
export type WSClientEvent =
  | { type: "message:send"; conversationId: string; text: string; replyToId?: string }
  | { type: "typing:start"; conversationId: string }
  | { type: "typing:stop"; conversationId: string }
  | { type: "conversation:read"; conversationId: string }
  | { type: "reaction:toggle"; messageId: string; emoji: string }
  | { type: "message:delete"; messageId: string };

// WebSocket events: Server → Client
export type WSServerEvent =
  | { type: "message:new"; message: ChatMessage; conversation: ChatConversation }
  | { type: "typing:indicator"; conversationId: string; userName: string; isTyping: boolean }
  | { type: "conversation:updated"; conversation: ChatConversation }
  | { type: "connected"; userId: string }
  | { type: "error"; code: string; message: string }
  | { type: "reaction:updated"; messageId: string; reactions: ReactionCount[] }
  | { type: "message:deleted"; messageId: string; conversationId: string };
