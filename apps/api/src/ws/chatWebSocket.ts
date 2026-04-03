import type { WSContext } from "hono/ws";
import type { WSClientEvent, WSServerEvent } from "@rearden/types";
import { addMessage, markAsRead } from "../data/chatStore.js";
import { verifyToken } from "../lib/auth.js";

interface ClientMeta {
  userId: string | null;
  alive: boolean;
}

const clients = new Map<WSContext, ClientMeta>();

export function broadcast(event: WSServerEvent) {
  const data = JSON.stringify(event);
  const dead: WSContext[] = [];
  for (const [ws] of clients) {
    try {
      ws.send(data);
    } catch {
      dead.push(ws);
    }
  }
  for (const ws of dead) {
    clients.delete(ws);
  }
}

// Heartbeat: ping every 30s, disconnect if no pong within 10s
const PING_INTERVAL = 30000;
const PONG_TIMEOUT = 10000;

const heartbeatInterval = setInterval(() => {
  const dead: WSContext[] = [];

  for (const [ws, meta] of clients) {
    if (!meta.alive) {
      dead.push(ws);
      continue;
    }

    meta.alive = false;
    try {
      ws.send(JSON.stringify({ type: "ping" }));
    } catch {
      dead.push(ws);
    }
  }

  for (const ws of dead) {
    try {
      ws.close();
    } catch {
      // ignore
    } finally {
      clients.delete(ws);
    }
  }
}, PING_INTERVAL);

export function stopHeartbeat() {
  clearInterval(heartbeatInterval);
}

export function createWSHandlers() {
  return {
    onOpen(_event: Event, ws: WSContext) {
      // Extract token from upgrade request
      const url = new URL(ws.url || "", "ws://localhost");
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(1008, "Authentication required");
        return;
      }

      try {
        const { userId } = verifyToken(token);
        clients.set(ws, { userId, alive: true });
        const connected: WSServerEvent = {
          type: "connected",
          userId,
        };
        ws.send(JSON.stringify(connected));
      } catch {
        ws.close(1008, "Invalid authentication token");
      }
    },

    onMessage(event: MessageEvent, ws: WSContext) {
      try {
        const raw = JSON.parse(String(event.data));

        // Handle pong response (not part of WSClientEvent union)
        if (raw.type === "pong") {
          const meta = clients.get(ws);
          if (meta) meta.alive = true;
          return;
        }

        handleClientEvent(raw as WSClientEvent, ws);
      } catch {
        const error: WSServerEvent = {
          type: "error",
          code: "INVALID_MESSAGE",
          message: "Failed to parse message",
        };
        ws.send(JSON.stringify(error));
      }
    },

    onClose(_event: Event, ws: WSContext) {
      clients.delete(ws);
    },

    onError(_event: Event, ws: WSContext) {
      clients.delete(ws);
    },
  };
}

async function handleClientEvent(event: WSClientEvent, ws: WSContext) {
  switch (event.type) {
    case "message:send": {
      const meta = clients.get(ws);
      if (!meta?.userId) {
        ws.close(1008, "Unauthenticated");
        return;
      }
      const userId = meta.userId;
      const result = await addMessage(
        event.conversationId,
        userId,
        "recruiter",
        event.text,
      );
      if (result) {
        broadcast({
          type: "message:new",
          message: result.message,
          conversation: result.conversation,
        });
      }
      break;
    }

    case "typing:start":
    case "typing:stop": {
      broadcast({
        type: "typing:indicator",
        conversationId: event.conversationId,
        userName: "You",
        isTyping: event.type === "typing:start",
      });
      break;
    }

    case "conversation:read": {
      const conv = await markAsRead(event.conversationId);
      if (conv) {
        broadcast({
          type: "conversation:updated",
          conversation: conv,
        });
      }
      break;
    }
  }
}
