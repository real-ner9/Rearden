import { create } from "zustand";
import { useEffect } from "react";
import {
  initialNotifications,
  incomingNotifications,
  type Notification,
} from "@/data/mockNotifications";
import { useSoundStore } from "./soundStore";

interface NotificationState {
  notifications: Notification[];
  dismiss: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,
  dismiss: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
    })),
}));

export const selectUnreadCount = (s: NotificationState) =>
  s.notifications.filter((n) => !n.read).length;

export function useNotificationInit() {
  useEffect(() => {
    const timers = incomingNotifications.map(({ notification, delayMs }) =>
      setTimeout(() => {
        useNotificationStore.getState().addNotification({
          ...notification,
          timestamp: new Date(),
        });
        useSoundStore.getState().playSound("notify");
      }, delayMs)
    );
    return () => timers.forEach(clearTimeout);
  }, []);
}
