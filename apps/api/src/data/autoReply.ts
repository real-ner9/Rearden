import type { WSServerEvent } from "@rearden/types";
import { addMessage, getConversation } from "./chatStore.js";

const replyPool = [
  "That sounds really interesting! Can you tell me more about the team culture?",
  "I've been looking for exactly this kind of opportunity. What's the interview process like?",
  "Great question! Let me think about that and get back to you.",
  "I'm very excited about this role. When would be a good time for a technical discussion?",
  "That's a fair point. I have experience with similar challenges at my current company.",
  "I appreciate you sharing that. The compensation range works well for me.",
  "Could you share more about the remote work policy?",
  "I've actually worked with that exact tech stack before. It's one of my favorites!",
  "Thank you for the detailed explanation. I'm even more interested now.",
  "I'm currently wrapping up a project, but I could start within two weeks.",
  "That's great to hear! Do you offer any learning and development benefits?",
  "I'd love to meet the team before making a final decision. Is that possible?",
  "Perfect, I'll prepare some examples of my work to share during the call.",
  "The project roadmap sounds ambitious. I love working on challenging problems!",
  "Would it be possible to do a short trial project? I think it would benefit both sides.",
];

let replyIndex = 0;

function getNextReply(): string {
  const reply = replyPool[replyIndex % replyPool.length]!;
  replyIndex++;
  return reply;
}

interface ActiveTimers {
  typingTimer: ReturnType<typeof setTimeout>;
  msgTimer?: ReturnType<typeof setTimeout>;
}

const activeTimers = new Map<string, ActiveTimers>();

export function scheduleAutoReply(
  conversationId: string,
  broadcast: (event: WSServerEvent) => void,
) {
  // Cancel any existing timers for this conversation (both typing and message)
  const existing = activeTimers.get(conversationId);
  if (existing) {
    clearTimeout(existing.typingTimer);
    if (existing.msgTimer) clearTimeout(existing.msgTimer);
    activeTimers.delete(conversationId);
  }

  const delay = 2000 + Math.random() * 3000; // 2-5 seconds

  const typingTimer = setTimeout(() => {
    // Fetch conversation to get user name
    getConversation(conversationId).then((conv) => {
      if (!conv) {
        activeTimers.delete(conversationId);
        return;
      }

      broadcast({
        type: "typing:indicator",
        conversationId,
        userName: conv.userName,
        isTyping: true,
      });

      const msgTimer = setTimeout(() => {
        broadcast({
          type: "typing:indicator",
          conversationId,
          userName: conv.userName,
          isTyping: false,
        });

        addMessage(conversationId, conv.userId, "user", getNextReply()).then(
          (result) => {
            if (result) {
              broadcast({
                type: "message:new",
                message: result.message,
                conversation: result.conversation,
              });
            }
            activeTimers.delete(conversationId);
          },
        );
      }, 1000 + Math.random() * 2000);

      const timers = activeTimers.get(conversationId);
      if (timers) {
        timers.msgTimer = msgTimer;
      }
    });
  }, delay);

  activeTimers.set(conversationId, { typingTimer });
}
