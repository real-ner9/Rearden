import { Hono } from "hono";
import type { ApiResponse } from "@rearden/types";
import {
  getConversations,
  getMessages,
  createConversation,
  addMessage,
  togglePin,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  deleteConversation,
  toggleReaction,
  deleteMessage,
} from "../data/chatStore.js";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import { rateLimit } from "../lib/rateLimit.js";

type AuthEnv = { Variables: { userId: string } };

export const chatRoutes = new Hono<AuthEnv>();

// Apply authentication to all chat routes
chatRoutes.use("*", authMiddleware);

// List conversations
chatRoutes.get("/", async (c) => {
  const convs = await getConversations();
  return c.json<ApiResponse>({ success: true, data: convs });
});

// List folders
chatRoutes.get("/folders", async (c) => {
  const userId = c.get("userId");
  const folders = await getFolders(userId);
  return c.json<ApiResponse>({ success: true, data: folders });
});

// Create folder
chatRoutes.post("/folders", async (c) => {
  const userId = c.get("userId");
  const { name } = await c.req.json<{ name: string }>();
  if (!name?.trim()) {
    return c.json<ApiResponse>({ success: false, error: "name is required" }, 400);
  }
  const folder = await createFolder(userId, name.trim());
  return c.json<ApiResponse>({ success: true, data: folder }, 201);
});

// Update folder
chatRoutes.patch("/folders/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; conversationIds?: string[]; order?: number }>();
  const folder = await updateFolder(id, userId, body);
  if (!folder) {
    return c.json<ApiResponse>({ success: false, error: "Folder not found" }, 404);
  }
  return c.json<ApiResponse>({ success: true, data: folder });
});

// Delete folder
chatRoutes.delete("/folders/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const ok = await deleteFolder(id, userId);
  if (!ok) {
    return c.json<ApiResponse>({ success: false, error: "Folder not found" }, 404);
  }
  return c.json<ApiResponse>({ success: true, data: null });
});

// Delete conversation
chatRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const ok = await deleteConversation(id, userId);
  if (!ok) {
    return c.json<ApiResponse>({ success: false, error: "Conversation not found" }, 404);
  }
  return c.json<ApiResponse>({ success: true, data: null });
});

// Get messages for a conversation
chatRoutes.get("/:id/messages", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const conversation = await db.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    return c.json<ApiResponse>({ success: false, error: "Conversation not found" }, 404);
  }

  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);

  const msgs = await getMessages(id, userId, cursor, limit);
  return c.json<ApiResponse>({ success: true, data: msgs });
});

// Create conversation
chatRoutes.post("/", async (c) => {
  const body = await c.req.json<{ userId: string }>();
  if (!body.userId) {
    return c.json<ApiResponse>(
      { success: false, error: "userId is required" },
      400,
    );
  }
  const conv = await createConversation(body.userId);
  return c.json<ApiResponse>({ success: true, data: conv }, 201);
});

// Send message
chatRoutes.post(
  "/:id/messages",
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = await c.req.json<{ text: string; replyToId?: string }>();
    if (!body.text?.trim()) {
      return c.json<ApiResponse>({ success: false, error: "text is required" }, 400);
    }
    const result = await addMessage(id, userId, "recruiter", body.text.trim(), body.replyToId);
    if (!result) {
      return c.json<ApiResponse>({ success: false, error: "Conversation not found" }, 404);
    }
    return c.json<ApiResponse>({ success: true, data: result.message }, 201);
  }
);

// Toggle pin
chatRoutes.patch("/:id/pin", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ isPinned: boolean }>();
  const conv = await togglePin(id, body.isPinned);
  if (!conv) {
    return c.json<ApiResponse>({ success: false, error: "Conversation not found" }, 404);
  }
  return c.json<ApiResponse>({ success: true, data: conv });
});

// Toggle reaction on a message
chatRoutes.post("/:convId/messages/:msgId/reactions", async (c) => {
  const userId = c.get("userId");
  const msgId = c.req.param("msgId");
  const { emoji } = await c.req.json<{ emoji: string }>();
  if (!emoji) {
    return c.json<ApiResponse>({ success: false, error: "emoji is required" }, 400);
  }
  const result = await toggleReaction(msgId, userId, emoji);
  if (!result) {
    return c.json<ApiResponse>({ success: false, error: "Message not found" }, 404);
  }
  return c.json<ApiResponse>({ success: true, data: result.reactions });
});

// Delete a message
chatRoutes.delete("/:convId/messages/:msgId", async (c) => {
  const userId = c.get("userId");
  const msgId = c.req.param("msgId");
  const result = await deleteMessage(msgId, userId);
  if (!result) {
    return c.json<ApiResponse>({ success: false, error: "Message not found or unauthorized" }, 404);
  }
  return c.json<ApiResponse>({ success: true, data: null });
});
