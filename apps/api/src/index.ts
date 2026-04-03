import "dotenv/config";
import "./lib/env.js"; // Validate environment variables at startup
import { serve } from "@hono/node-server";
import { app, injectWebSocket } from "./app.js";
import { stopHeartbeat } from "./ws/chatWebSocket.js";
import { stopRateLimitCleanup } from "./lib/rateLimit.js";
import { db } from "./lib/db.js";

const port = Number(process.env.PORT) || 3001;

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`);
});

injectWebSocket(server);

// Освобождаем порт при завершении (tsx --watch на Windows не делает это сам)
const shutdown = async () => {
  stopHeartbeat();
  stopRateLimitCleanup();
  await db.$disconnect();
  (server as any).closeAllConnections?.();
  server.close();
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
