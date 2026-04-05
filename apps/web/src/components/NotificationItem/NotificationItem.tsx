import { motion } from "motion/react";
import type { Notification, NotificationType } from "@/data/mockNotifications";
import styles from "./NotificationItem.module.scss";

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
  onAction?: (path: string) => void;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const typeIcons: Record<NotificationType, string> = {
  new_user: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
  new_follow: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 11l-3 3-3-3M19 14V4",
  interview_scheduled: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  message_received: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  status_change: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

export function NotificationItem({
  notification,
  onDismiss,
  onMarkRead,
  onAction,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) onMarkRead(notification.id);
    if (notification.actionPath && onAction) onAction(notification.actionPath);
  };

  return (
    <motion.div
      className={`${styles.item} ${notification.read ? "" : styles.unread}`}
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={handleClick}
    >
      <div className={styles.icon}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={typeIcons[notification.type]} />
          {notification.type === "new_user" && <circle cx="12" cy="7" r="4" />}
        </svg>
      </div>

      <div className={styles.content}>
        <p className={styles.message}>{notification.message}</p>
        {notification.detail && (
          <p className={styles.detail}>{notification.detail}</p>
        )}
        <span className={styles.time}>{timeAgo(notification.timestamp)}</span>
      </div>

      <button
        className={styles.dismiss}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        aria-label="Dismiss"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  );
}
