import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { createNodeWebSocket } from "@hono/node-ws";
import type { ApiResponse } from "@rearden/types";
import { candidateRoutes } from "./routes/candidates.js";
import { searchRoutes } from "./routes/search.js";
import { uploadRoutes } from "./routes/upload.js";
import { chatRoutes } from "./routes/chat.js";
import { postRoutes } from "./routes/posts.js";
import { vacancyRoutes } from "./routes/vacancies.js";
import { createWSHandlers } from "./ws/chatWebSocket.js";

export const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
export { injectWebSocket };

app.use("*", logger());
app.use("*", cors());

app.get("/", (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: { message: "Rearden API" },
  });
});

app.get("/health", (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

// WebSocket
app.get("/ws", upgradeWebSocket(() => createWSHandlers()));

// API routes
app.route("/api/candidates", candidateRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/chat", chatRoutes);
app.route("/api/posts", postRoutes);
app.route("/api/vacancies", vacancyRoutes);
