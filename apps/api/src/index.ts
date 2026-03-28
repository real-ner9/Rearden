import "dotenv/config";
import { serve } from "@hono/node-server";
import { app, injectWebSocket } from "./app.js";

const port = Number(process.env.PORT) || 3001;

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`);
});

injectWebSocket(server);

// Освобождаем порт при завершении (tsx --watch на Windows не делает это сам)
const shutdown = () => {
  (server as any).closeAllConnections?.();
  server.close();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
