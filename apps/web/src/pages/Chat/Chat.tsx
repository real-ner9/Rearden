import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, useDragControls, useMotionValue, animate } from "motion/react";
import { useChatStore } from "@/stores/chatStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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

function MobileConversationPanel() {
  const closeConversation = useChatStore((s) => s.closeConversation);
  const registerClosePanel = useChatStore((s) => s.registerClosePanel);
  const dragControls = useDragControls();
  const panelX = useMotionValue(0);
  const [closing, setClosing] = useState(false);

  const dismiss = useCallback(() => {
    setClosing(true);
  }, []);

  useEffect(() => {
    registerClosePanel(dismiss);
    return () => registerClosePanel(null);
  }, [dismiss, registerClosePanel]);

  return (
    <motion.div
      className={styles.mobileConversation}
      style={{ x: panelX }}
      initial={{ x: "100%" }}
      animate={{ x: closing ? "100%" : 0 }}
      transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      onAnimationComplete={() => {
        if (closing) closeConversation();
      }}
      drag={closing ? false : "x"}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ left: 0 }}
      dragElastic={{ left: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100 || info.velocity.x > 400) {
          setClosing(true);
        } else {
          animate(panelX, 0, { type: "tween", duration: 0.15 });
        }
      }}
    >
      <div
        className={styles.edgeDragArea}
        onPointerDown={(e) => { if (!closing) dragControls.start(e); }}
      />
      <ChatConversation />
    </motion.div>
  );
}

export function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const activeTab = useChatStore((s) => s.activeTab);
  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const openConversation = useChatStore((s) => s.openConversation);
  const [sidebarWidth, setSidebarWidth] = useState(getInitialWidth);
  const dragging = useRef(false);

  // Initialize tab from URL on mount
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab) setActiveTab(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync activeTab → URL search params
  useEffect(() => {
    const currentUrlTab = searchParams.get("tab") ?? "all";
    if (currentUrlTab !== activeTab) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (activeTab === "all") {
          next.delete("tab");
        } else {
          next.set("tab", activeTab);
        }
        return next;
      }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Bidirectional sync: URL param ↔ activeConversationId
  const prevParamRef = useRef(conversationId);
  const prevActiveRef = useRef(activeConversationId);

  useEffect(() => {
    const paramChanged = conversationId !== prevParamRef.current;
    const activeChanged = activeConversationId !== prevActiveRef.current;
    prevParamRef.current = conversationId;
    prevActiveRef.current = activeConversationId;

    if (paramChanged && conversationId && conversationId !== activeConversationId) {
      openConversation(conversationId);
    } else if (activeChanged && activeConversationId !== (conversationId ?? null)) {
      const search = searchParams.toString();
      const qs = search ? `?${search}` : "";
      if (activeConversationId) {
        navigate(`/chat/${activeConversationId}${qs}`, { replace: true });
      } else {
        navigate(`/chat${qs}`, { replace: true });
      }
    }
  }, [conversationId, activeConversationId, openConversation, navigate, searchParams]);

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

  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className={styles.chat}>
      {isMobile ? (
        <div className={styles.mobileContainer}>
          <ChatSidebar />
          {activeConversationId && <MobileConversationPanel />}
        </div>
      ) : (
        <>
          <div className={styles.sidebar} style={{ width: sidebarWidth }}>
            <ChatSidebar />
          </div>
          <div className={styles.resizeHandle} onMouseDown={onMouseDown} />
          <div className={styles.conversation}>
            <ChatConversation />
          </div>
        </>
      )}
    </div>
  );
}
