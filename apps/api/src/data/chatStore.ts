import type { ChatMessage, ChatConversation } from "@rearden/types";
import { db } from "../lib/db.js";

function toConversation(row: any): ChatConversation {
  const lastMsg = row.messages?.[0];
  return {
    id: row.id,
    candidateId: row.candidateId,
    candidateName: row.candidate?.name ?? "",
    candidateAvatar: row.candidate?.thumbnailUrl ?? null,
    isPinned: row.isPinned,
    unreadCount: row.unreadCount,
    lastMessage: lastMsg
      ? {
          id: lastMsg.id,
          conversationId: lastMsg.conversationId,
          senderId: lastMsg.senderId,
          senderRole: lastMsg.senderRole,
          text: lastMsg.text,
          createdAt: lastMsg.createdAt.toISOString(),
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    senderRole: row.senderRole,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  };
}

const conversationInclude = {
  candidate: { select: { name: true, thumbnailUrl: true } },
  messages: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

export async function getConversations(): Promise<ChatConversation[]> {
  const rows = await db.conversation.findMany({
    include: conversationInclude,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toConversation);
}

export async function getConversation(id: string): Promise<ChatConversation | null> {
  const row = await db.conversation.findUnique({
    where: { id },
    include: conversationInclude,
  });
  return row ? toConversation(row) : null;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const rows = await db.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toMessage);
}

export async function addMessage(
  conversationId: string,
  senderId: string,
  senderRole: "recruiter" | "candidate",
  text: string,
): Promise<{ message: ChatMessage; conversation: ChatConversation } | null> {
  const conv = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return null;

  const msg = await db.chatMessage.create({
    data: {
      conversationId,
      senderId,
      senderRole,
      text,
    },
  });

  const updatedConv = await db.conversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date(),
      unreadCount: senderRole === "candidate" ? { increment: 1 } : undefined,
    },
    include: conversationInclude,
  });

  return {
    message: toMessage(msg),
    conversation: toConversation(updatedConv),
  };
}

export async function togglePin(conversationId: string, isPinned: boolean): Promise<ChatConversation | null> {
  try {
    const row = await db.conversation.update({
      where: { id: conversationId },
      data: { isPinned },
      include: conversationInclude,
    });
    return toConversation(row);
  } catch {
    return null;
  }
}

export async function markAsRead(conversationId: string): Promise<ChatConversation | null> {
  try {
    const row = await db.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
      include: conversationInclude,
    });
    return toConversation(row);
  } catch {
    return null;
  }
}

export async function createConversation(candidateId: string, _candidateName: string): Promise<ChatConversation> {
  // Check if conversation already exists for this candidate
  const existing = await db.conversation.findUnique({
    where: { candidateId },
    include: conversationInclude,
  });
  if (existing) return toConversation(existing);

  const row = await db.conversation.create({
    data: { candidateId },
    include: conversationInclude,
  });
  return toConversation(row);
}
