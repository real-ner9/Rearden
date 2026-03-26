import type { WSContext } from "hono/ws";
import type { WSClientEvent, WSServerEvent } from "@rearden/types";
import { addMessage, markAsRead } from "../data/chatStore.js";
import { scheduleAutoReply } from "../data/autoReply.js";

const clients = new Set<WSContext>();

export function broadcast(event: WSServerEvent) {
  const data = JSON.stringify(event);
  for (const ws of clients) {
    try {
      ws.send(data);
    } catch {
      clients.delete(ws);
    }
  }
}

export function createWSHandlers() {
  return {
    onOpen(_event: Event, ws: WSContext) {
      clients.add(ws);
      const connected: WSServerEvent = {
        type: "connected",
        userId: "system",
      };
      ws.send(JSON.stringify(connected));
    },

    onMessage(event: MessageEvent, ws: WSContext) {
      try {
        const data = JSON.parse(String(event.data)) as WSClientEvent;
        handleClientEvent(data, ws);
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

async function handleClientEvent(event: WSClientEvent, _ws: WSContext) {
  switch (event.type) {
    case "message:send": {
      const result = await addMessage(
        event.conversationId,
        "recruiter-1",
        "recruiter",
        event.text,
      );
      if (result) {
        broadcast({
          type: "message:new",
          message: result.message,
          conversation: result.conversation,
        });
        scheduleAutoReply(event.conversationId, broadcast);
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
