import { Hono } from "hono";
import type { ApiResponse } from "@rearden/types";
import {
  getConversations,
  getMessages,
  createConversation,
  addMessage,
  togglePin,
} from "../data/chatStore.js";

export const chatRoutes = new Hono();

// List conversations
chatRoutes.get("/", async (c) => {
  const convs = await getConversations();
  return c.json<ApiResponse>({ success: true, data: convs });
});

// Get messages for a conversation
chatRoutes.get("/:id/messages", async (c) => {
  const id = c.req.param("id");
  const msgs = await getMessages(id);
  return c.json<ApiResponse>({ success: true, data: msgs });
});

// Create conversation
chatRoutes.post("/", async (c) => {
  const body = await c.req.json<{ userId: string; userName: string }>();
  if (!body.userId || !body.userName) {
    return c.json<ApiResponse>(
      { success: false, error: "userId and userName are required" },
      400,
    );
  }
  const conv = await createConversation(body.userId, body.userName);
  return c.json<ApiResponse>({ success: true, data: conv }, 201);
});

// Send message
chatRoutes.post("/:id/messages", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ text: string }>();
  if (!body.text?.trim()) {
    return c.json<ApiResponse>({ success: false, error: "text is required" }, 400);
  }
  const result = await addMessage(id, "recruiter-1", "recruiter", body.text.trim());
  if (!result) {
    return c.json<ApiResponse>({ success: false, error: "Conversation not found" }, 404);
  }
  return c.json<ApiResponse>({ success: true, data: result.message }, 201);
});

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
