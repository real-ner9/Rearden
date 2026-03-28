import { useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useChatStore } from "@/stores/chatStore";

export function ChatWebSocketBridge() {
  const handleWSMessage = useChatStore((s) => s.handleWSMessage);
  const setSend = useChatStore((s) => s.setSend);
  const setConnectionStatus = useChatStore((s) => s.setConnectionStatus);

  const { send, status } = useWebSocket({ onMessage: handleWSMessage });

  useEffect(() => {
    setSend(send);
  }, [send, setSend]);

  useEffect(() => {
    setConnectionStatus(status);
  }, [status, setConnectionStatus]);

  return null;
}
