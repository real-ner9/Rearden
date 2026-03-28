import { AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  useNotificationStore,
  selectUnreadCount,
} from "@/stores/notificationStore";
import { NotificationItem } from "@/components/NotificationItem/NotificationItem";
import styles from "./NotificationPanel.module.scss";

export function NotificationPanel() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore(selectUnreadCount);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const navigate = useNavigate();

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.count}>
          {unreadCount > 0 ? `${unreadCount} new` : "All read"}
        </span>
        {unreadCount > 0 && (
          <button className={styles.markAll} onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className={styles.list}>
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={dismiss}
              onMarkRead={markRead}
              onAction={(path) => navigate(path)}
            />
          ))}
        </AnimatePresence>
        {notifications.length === 0 && (
          <p className={styles.empty}>No notifications</p>
        )}
      </div>
    </div>
  );
}
