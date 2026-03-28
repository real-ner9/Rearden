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
} from "../data/chatStore.js";

export const chatRoutes = new Hono();

// List conversations
chatRoutes.get("/", async (c) => {
  const convs = await getConversations();
  return c.json<ApiResponse>({ success: true, data: convs });
});

// List folders
chatRoutes.get("/folders", async (c) => {
  const folders = await getFolders("recruiter-1");
  return c.json<ApiResponse>({ success: true, data: folders });
});

// Create folder
chatRoutes.post("/folders", async (c) => {
  const { name } = await c.req.json<{ name: string }>();
  if (!name?.trim()) {
    return c.json<ApiResponse>({ success: false, error: "name is required" }, 400);
  }
  const folder = await createFolder("recruiter-1", name.trim());
  return c.json<ApiResponse>({ success: true, data: folder }, 201);
});

// Update folder
chatRoutes.patch("/folders/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; conversationIds?: string[]; order?: number }>();
  const folder = await updateFolder(id, "recruiter-1", body);
  if (!folder) {
    return c.json<ApiResponse>({ success: false, error: "Folder not found" }, 404);
  }
  return c.json<ApiResponse>({ success: true, data: folder });
});

// Delete folder
chatRoutes.delete("/folders/:id", async (c) => {
  const id = c.req.param("id");
  const ok = await deleteFolder(id, "recruiter-1");
  if (!ok) {
    return c.json<ApiResponse>({ success: false, error: "Folder not found" }, 404);
  }
  return c.json<ApiResponse>({ success: true, data: null });
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
