import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Heart, List } from "@phosphor-icons/react";
import { useAuthStore } from "@/stores/authStore";
import { useHeaderStore } from "@/stores/headerStore";
import {
  useNotificationStore,
  selectUnreadCount,
} from "@/stores/notificationStore";
import styles from "./MobileHeader.module.scss";

export function MobileHeader() {
  const user = useAuthStore((s) => s.user);
  const headerTitle = useHeaderStore((s) => s.title);
  const notifUnread = useNotificationStore(selectUnreadCount);
  const navigate = useNavigate();
  const location = useLocation();

  const isFeedPage =
    location.pathname === "/feed" || location.pathname.startsWith("/feed/");
  const isAuthPage = location.pathname === "/auth";
  const isNotificationsPage = location.pathname === "/notifications";
  const isSettingsPage = location.pathname === "/profile/settings";
  const isPostDetailPage = location.pathname.startsWith("/post/");
  const isProfilePage =
    location.pathname === "/profile" ||
    location.pathname.startsWith("/profile/") ||
    location.pathname.startsWith("/user/");

  if (isFeedPage || isAuthPage || isNotificationsPage || isSettingsPage || isPostDetailPage) return null;

  const handleCreate = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/create" } });
    } else {
      navigate("/create");
    }
  };

  const handleRightAction = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (isProfilePage) {
      navigate("/profile/settings");
    } else {
      navigate("/notifications");
    }
  };

  return (
    <header className={styles.mobileHeader}>
      <button className={styles.iconBtn} onClick={handleCreate}>
        <Plus size={24} weight="bold" />
      </button>

      <span className={styles.logo}>{headerTitle || "REARDEN"}</span>

      <button className={styles.iconBtn} onClick={handleRightAction}>
        {isProfilePage ? (
          <List size={24} weight="bold" />
        ) : (
          <>
            <Heart size={24} weight="regular" />
            {notifUnread > 0 && (
              <span className={styles.badge}>{notifUnread}</span>
            )}
          </>
        )}
      </button>
    </header>
  );
}
