import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChat } from "@/contexts/ChatContext";
import { ChatSidebar } from "./ChatSidebar";
import { ChatConversation } from "./ChatConversation";
import styles from "./Chat.module.scss";

const SIDEBAR_MIN = 240;
const SIDEBAR_MAX = 600;
const SIDEBAR_DEFAULT = 340;
const SIDEBAR_WIDTH_KEY = "chat-sidebar-width";

function getInitialWidth(): number {
  const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
  if (stored) {
    const n = Number(stored);
    if (n >= SIDEBAR_MIN && n <= SIDEBAR_MAX) return n;
  }
  return SIDEBAR_DEFAULT;
}

export function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { activeConversationId, openConversation } = useChat();
  const [sidebarWidth, setSidebarWidth] = useState(getInitialWidth);
  const dragging = useRef(false);

  // Bidirectional sync: URL param ↔ activeConversationId
  const prevParamRef = useRef(conversationId);
  const prevActiveRef = useRef(activeConversationId);

  useEffect(() => {
    const paramChanged = conversationId !== prevParamRef.current;
    const activeChanged = activeConversationId !== prevActiveRef.current;
    prevParamRef.current = conversationId;
    prevActiveRef.current = activeConversationId;

    if (paramChanged && conversationId && conversationId !== activeConversationId) {
      // URL changed (e.g. user navigated) → open the conversation
      openConversation(conversationId);
    } else if (activeChanged && activeConversationId !== (conversationId ?? null)) {
      // Active conversation changed programmatically → update URL
      if (activeConversationId) {
        navigate(`/chat/${activeConversationId}`, { replace: true });
      } else {
        navigate("/chat", { replace: true });
      }
    }
  }, [conversationId, activeConversationId, openConversation, navigate]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, ev.clientX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      // Save on release
      setSidebarWidth((w) => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w));
        return w;
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <div className={styles.chat}>
      {/* Desktop: both panels */}
      <div className={styles.sidebarDesktop} style={{ width: sidebarWidth }}>
        <ChatSidebar />
      </div>
      <div className={styles.resizeHandle} onMouseDown={onMouseDown} />
      <div className={styles.conversationDesktop}>
        <ChatConversation />
      </div>

      {/* Mobile: single panel */}
      <div className={styles.mobileContainer}>
        {activeConversationId ? (
          <div className={styles.mobilePanel}>
            <ChatConversation />
          </div>
        ) : (
          <div className={styles.mobilePanel}>
            <ChatSidebar />
          </div>
        )}
      </div>
    </div>
  );
}
