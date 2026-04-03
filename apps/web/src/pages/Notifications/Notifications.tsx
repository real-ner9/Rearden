import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft } from "@phosphor-icons/react";
import {
  useNotificationStore,
  selectUnreadCount,
} from "@/stores/notificationStore";
import { NotificationItem } from "@/components/NotificationItem/NotificationItem";
import styles from "./Notifications.module.scss";

export function Notifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore(selectUnreadCount);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const navigate = useNavigate();

  return (
    <motion.div
      className={styles.page}
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
    >
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={22} weight="bold" />
        </button>
        <span className={styles.title}>Notifications</span>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </header>

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
          <p className={styles.empty}>No notifications yet</p>
        )}
      </div>
    </motion.div>
  );
}
