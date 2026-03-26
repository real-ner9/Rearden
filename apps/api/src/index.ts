import "dotenv/config";
import { serve } from "@hono/node-server";
import { app, injectWebSocket } from "./app.js";

const port = Number(process.env.PORT) || 3001;
const MAX_RETRIES = 10;
let attempt = 0;

function start() {
  const server = serve({ fetch: app.fetch, port }, (info) => {
    attempt = 0; // reset on successful start
    console.log(`API server running on http://localhost:${info.port}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      attempt++;
      if (attempt >= MAX_RETRIES) {
        console.error(`Port ${port} still in use after ${MAX_RETRIES} retries.`);
        process.exit(1);
      }
      const delay = Math.min(500 * attempt, 3000);
      console.log(`Port ${port} in use, retrying in ${delay}ms (${attempt}/${MAX_RETRIES})...`);
      setTimeout(start, delay);
      return;
    }
    throw err;
  });

  injectWebSocket(server);

  // Graceful shutdown — release port on process termination
  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 3000);
  };

  // Remove old listeners to avoid leaks on retry
  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
