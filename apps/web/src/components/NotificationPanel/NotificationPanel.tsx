import { AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationItem } from "@/components/NotificationItem/NotificationItem";
import styles from "./NotificationPanel.module.scss";

export function NotificationPanel() {
  const { notifications, unreadCount, dismiss, markRead, markAllRead } =
    useNotifications();
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
