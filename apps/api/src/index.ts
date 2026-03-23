import "dotenv/config";
import { serve } from "@hono/node-server";
import { app, injectWebSocket } from "./app.js";

const port = Number(process.env.PORT) || 3001;

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`);
});

injectWebSocket(server);
