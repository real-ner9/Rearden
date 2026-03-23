import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  initialNotifications,
  incomingNotifications,
  type Notification,
} from "@/data/mockNotifications";
import { useSound } from "@/hooks/useSound";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  dismiss: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const { playSound } = useSound();

  useEffect(() => {
    const timers = incomingNotifications.map(({ notification, delayMs }) =>
      setTimeout(() => {
        setNotifications((prev) => [
          { ...notification, timestamp: new Date() },
          ...prev,
        ]);
        playSound("notify");
      }, delayMs),
    );
    return () => timers.forEach(clearTimeout);
  }, [playSound]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, dismiss, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
