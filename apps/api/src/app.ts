import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { createNodeWebSocket } from "@hono/node-ws";
import type { ApiResponse } from "@rearden/types";
import { userRoutes } from "./routes/users.js";
import { searchRoutes } from "./routes/search.js";
import { uploadRoutes } from "./routes/upload.js";
import { chatRoutes } from "./routes/chat.js";
import { postRoutes } from "./routes/posts.js";
import { vacancyRoutes } from "./routes/vacancies.js";
import { authRoutes } from "./routes/auth.js";
import { profileRoutes } from "./routes/profile.js";
import { createWSHandlers } from "./ws/chatWebSocket.js";

export const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
export { injectWebSocket };

app.use("*", logger());

// CORS configuration
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Security headers
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
});

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
app.route("/api/users", userRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/chat", chatRoutes);
app.route("/api/posts", postRoutes);
app.route("/api/vacancies", vacancyRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/me/profile", profileRoutes);
