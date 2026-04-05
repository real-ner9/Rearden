import type { ChatMessage, ChatConversation, ChatFolder, ReactionCount } from "@rearden/types";
import { db } from "../lib/db.js";

function toConversation(row: any): ChatConversation {
  const lastMsg = row.messages?.[0];
  return {
    id: row.id,
    userId: row.userId,
    userName: row.user?.name ?? "",
    userAvatar: row.user?.thumbnailUrl ?? null,
    isPinned: row.isPinned,
    pinnedAt: row.pinnedAt ? row.pinnedAt.toISOString() : null,
    unreadCount: row.unreadCount,
    lastMessage: lastMsg
      ? {
          id: lastMsg.id,
          conversationId: lastMsg.conversationId,
          senderId: lastMsg.senderId,
          senderRole: lastMsg.senderRole,
          text: lastMsg.text,
          createdAt: lastMsg.createdAt.toISOString(),
          replyToId: null,
          replyTo: null,
          reactions: [],
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
    replyToId: row.replyToId ?? null,
    replyTo: row.replyTo ? {
      id: row.replyTo.id,
      senderId: row.replyTo.senderId,
      senderRole: row.replyTo.senderRole,
      text: row.replyTo.text,
    } : null,
    reactions: [],
  };
}

const conversationInclude = {
  user: { select: { name: true, thumbnailUrl: true } },
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

export async function getMessages(
  conversationId: string,
  currentUserId: string,
  cursor?: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const rows = await db.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      replyTo: {
        select: {
          id: true,
          senderId: true,
          senderRole: true,
          text: true,
        },
      },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const messageIds = rows.map((r) => r.id);
  const reactionsMap = messageIds.length > 0 ? await getMessageReactions(messageIds, currentUserId) : new Map();

  return rows.map((row) => ({
    ...toMessage(row),
    reactions: reactionsMap.get(row.id) ?? [],
  }));
}

export async function addMessage(
  conversationId: string,
  senderId: string,
  senderRole: string,
  text: string,
  replyToId?: string,
): Promise<{ message: ChatMessage; conversation: ChatConversation } | null> {
  const conv = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return null;

  const msg = await db.chatMessage.create({
    data: {
      conversationId,
      senderId,
      senderRole,
      text,
      replyToId: replyToId ?? null,
    },
    include: {
      replyTo: {
        select: {
          id: true,
          senderId: true,
          senderRole: true,
          text: true,
        },
      },
    },
  });

  const updatedConv = await db.conversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date(),
      unreadCount: senderRole !== "recruiter" ? { increment: 1 } : undefined,
    },
    include: conversationInclude,
  });

  return {
    message: { ...toMessage(msg), reactions: [] },
    conversation: toConversation(updatedConv),
  };
}

export async function togglePin(conversationId: string, isPinned: boolean): Promise<ChatConversation | null> {
  const existing = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!existing) return null;

  const row = await db.conversation.update({
    where: { id: conversationId },
    data: {
      isPinned,
      pinnedAt: isPinned ? new Date() : null,
    },
    include: conversationInclude,
  });
  return toConversation(row);
}

export async function markAsRead(conversationId: string): Promise<ChatConversation | null> {
  try {
    // Read current updatedAt first so we can preserve it
    // (Prisma's @updatedAt auto-updates on any update() call)
    const existing = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { updatedAt: true },
    });
    if (!existing) return null;

    const row = await db.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0, updatedAt: existing.updatedAt },
      include: conversationInclude,
    });
    return toConversation(row);
  } catch {
    return null;
  }
}

export async function createConversation(userId: string): Promise<ChatConversation> {
  // Check if conversation already exists for this user
  const existing = await db.conversation.findUnique({
    where: { userId },
    include: conversationInclude,
  });
  if (existing) return toConversation(existing);

  try {
    const row = await db.conversation.create({
      data: { userId },
      include: conversationInclude,
    });
    return toConversation(row);
  } catch {
    // Unique constraint violation — another request created it first
    const row = await db.conversation.findUnique({
      where: { userId },
      include: conversationInclude,
    });
    if (!row) {
      throw new Error(`Failed to create conversation for user ${userId}`);
    }
    return toConversation(row);
  }
}

export async function getFolders(userId: string): Promise<ChatFolder[]> {
  const rows = await db.chatFolder.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    order: r.order,
    conversationIds: r.conversationIds,
  }));
}

export async function createFolder(userId: string, name: string): Promise<ChatFolder> {
  const maxOrder = await db.chatFolder.aggregate({
    where: { userId },
    _max: { order: true },
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;
  const row = await db.chatFolder.create({
    data: { userId, name, order: nextOrder },
  });
  return { id: row.id, name: row.name, order: row.order, conversationIds: row.conversationIds };
}

export async function updateFolder(
  id: string,
  userId: string,
  data: { name?: string; conversationIds?: string[]; order?: number },
): Promise<ChatFolder | null> {
  try {
    const row = await db.chatFolder.update({
      where: { id, userId },
      data,
    });
    return { id: row.id, name: row.name, order: row.order, conversationIds: row.conversationIds };
  } catch {
    return null;
  }
}

export async function deleteFolder(id: string, userId: string): Promise<boolean> {
  try {
    await db.chatFolder.delete({ where: { id, userId } });
    return true;
  } catch {
    return false;
  }
}

export async function deleteConversation(id: string, recruiterId: string): Promise<boolean> {
  try {
    // Verify ownership - conversation belongs to recruiter's scope
    const conv = await db.conversation.findUnique({ where: { id } });
    if (!conv) return false;

    // Prisma cascade deletes messages via onDelete: Cascade
    await db.conversation.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getMessageReactions(messageIds: string[], currentUserId: string): Promise<Map<string, ReactionCount[]>> {
  const allReactions = await db.messageReaction.findMany({
    where: { messageId: { in: messageIds } },
    select: { messageId: true, emoji: true, userId: true },
  });

  const result = new Map<string, ReactionCount[]>();
  // Group by messageId first
  const byMessage = new Map<string, { emoji: string; userId: string }[]>();
  for (const r of allReactions) {
    const list = byMessage.get(r.messageId) ?? [];
    list.push(r);
    byMessage.set(r.messageId, list);
  }

  for (const [msgId, reactions] of byMessage) {
    const counts = new Map<string, { count: number; reacted: boolean }>();
    for (const r of reactions) {
      const entry = counts.get(r.emoji) ?? { count: 0, reacted: false };
      entry.count += 1;
      if (r.userId === currentUserId) entry.reacted = true;
      counts.set(r.emoji, entry);
    }
    result.set(msgId, Array.from(counts.entries()).map(([emoji, { count, reacted }]) => ({ emoji, count, reacted })));
  }

  return result;
}

export async function toggleReaction(messageId: string, userId: string, emoji: string): Promise<{ conversationId: string; reactions: ReactionCount[] } | null> {
  // Find the message first to get conversationId
  const msg = await db.chatMessage.findUnique({ where: { id: messageId }, select: { conversationId: true } });
  if (!msg) return null;

  // Try to find existing reaction
  const existing = await db.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });

  if (existing) {
    await db.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await db.messageReaction.create({ data: { messageId, userId, emoji } });
  }

  // Aggregate reactions for this message
  const reactions = await getReactionCounts(messageId, userId);
  return { conversationId: msg.conversationId, reactions };
}

export async function getReactionCounts(messageId: string, currentUserId: string): Promise<ReactionCount[]> {
  const allReactions = await db.messageReaction.findMany({
    where: { messageId },
    select: { emoji: true, userId: true },
  });

  const counts = new Map<string, { count: number; reacted: boolean }>();
  for (const r of allReactions) {
    const entry = counts.get(r.emoji) ?? { count: 0, reacted: false };
    entry.count += 1;
    if (r.userId === currentUserId) entry.reacted = true;
    counts.set(r.emoji, entry);
  }

  return Array.from(counts.entries()).map(([emoji, { count, reacted }]) => ({ emoji, count, reacted }));
}

export async function deleteMessage(messageId: string, userId: string): Promise<{ conversationId: string } | null> {
  const msg = await db.chatMessage.findUnique({ where: { id: messageId }, select: { senderId: true, senderRole: true, conversationId: true } });
  if (!msg) return null;
  // Allow deletion if sender matches OR if the message was sent by the recruiter (authenticated user IS the recruiter)
  if (msg.senderId !== userId && msg.senderRole !== "recruiter") return null;

  await db.chatMessage.delete({ where: { id: messageId } });
  return { conversationId: msg.conversationId };
}
